import type { TraceContext } from '../telemetry/trace.js';
import type { ToolResult, CompetitionData, Competitor } from '../types/index.js';
import { query } from '../data/motherduck.js';
import { sqlHaversine } from '../utils/haversine.js';
import { narrativize } from '../llm/client.js';

export async function competitiveLandscape(
  ctx: TraceContext,
  lat: number,
  lng: number,
  naicsCodes: number[],
  radiusMiles: number,
  businessType: string = '',
  address: string = ''
): Promise<ToolResult<CompetitionData>> {
  // DB has mixed-length NAICS codes (2-6 digits) from different NAICS revision years.
  // LLM returns both 6-digit specific codes and 4-digit industry group codes.
  // Use 4-digit prefix matching to catch all related businesses across code lengths.
  const prefixes = [...new Set(naicsCodes.map(c => String(c).slice(0, 4)))];
  const naicsFilter = prefixes.map(p => `CAST(naics_code AS VARCHAR) LIKE '${p}%'`).join(' OR ');
  const haversine = sqlHaversine('lat', 'lng', lat, lng);

  const [competitors, survivalData] = await Promise.all([
    query<any>(ctx, 'competitors', `
      WITH nearby AS (
        SELECT
          dba_name,
          naics_code,
          naics_description,
          address_zip,
          ${haversine} AS distance_miles
        FROM businesses_active
        WHERE lat IS NOT NULL AND lng IS NOT NULL
          AND (${naicsFilter})
      )
      SELECT * FROM nearby
      WHERE distance_miles <= ${radiusMiles}
      ORDER BY distance_miles
    `),
    query<any>(ctx, 'survivalRate', `
      SELECT
        COUNT(*) FILTER (WHERE cert_status = 'active') AS active_count,
        COUNT(*) AS total_count
      FROM businesses_all
      WHERE (${naicsFilter})
    `)
  ]);

  const competitorList: Competitor[] = competitors.map((r: any) => ({
    dbaName: r.dba_name ?? 'Unknown',
    naicsCode: Number(r.naics_code),
    naicsDescription: r.naics_description ?? '',
    distanceMiles: Number(Number(r.distance_miles).toFixed(3)),
    address: r.address_zip ?? ''
  }));

  const count = competitorList.length;
  const area = Math.PI * radiusMiles * radiusMiles;
  const marketDensity = area > 0 ? count / area : 0;

  const sv = survivalData[0];
  const total = Number(sv?.total_count ?? 0);
  const active = Number(sv?.active_count ?? 0);
  const survivalRate = total === 0 ? null : Math.round((active / total) * 10000) / 100;

  let glowColor: 'green' | 'amber' | 'red';
  if (count <= 10) glowColor = 'green';
  else if (count <= 25) glowColor = 'amber';
  else glowColor = 'red';

  const data: CompetitionData = {
    competitors: competitorList,
    count,
    radiusMiles,
    marketDensity: Math.round(marketDensity * 100) / 100,
    survivalRate,
    survivalSampleSize: total
  };

  const narrative = await narrativize(ctx, 'competition', businessType, address, data);

  return { data, narrative, glowColor };
}
