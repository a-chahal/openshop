import type { TraceContext } from '../telemetry/trace.js';
import type { ToolResult, NeighborhoodData, CrimeSummary, ServiceRequest311, StreetQuality } from '../types/index.js';
import { getCrime } from '../data/arcgis.js';
import { query } from '../data/motherduck.js';
import { narrativize } from '../llm/client.js';

export async function neighborhoodProfile(
  ctx: TraceContext,
  lat: number,
  lng: number,
  communityName: string,
  businessType: string = '',
  address: string = ''
): Promise<ToolResult<NeighborhoodData>> {
  const safeCommunity = communityName.replace(/'/g, "''");

  const results = await Promise.allSettled([
    getCrime(ctx, lat, lng, 500, new Date().getFullYear() - 1),
    query<any>(ctx, '311responsiveness', `
      SELECT
        AVG(case_age_days) AS avg_case_age,
        service_name,
        COUNT(*) AS cnt
      FROM gid_311_all
      WHERE comm_plan_name ILIKE '%${safeCommunity}%'
      GROUP BY service_name
      ORDER BY cnt DESC
      LIMIT 10
    `),
    queryStreetQuality(ctx, safeCommunity)
  ]);

  // Crime
  let crimeByCategory: CrimeSummary[] = [];
  let totalCrimes = 0;
  let violentCrimeRate = 0;
  if (results[0].status === 'fulfilled') {
    const crimes = results[0].value;
    const catMap = new Map<string, CrimeSummary>();
    for (const c of crimes) {
      const existing = catMap.get(c.category);
      if (existing) {
        existing.count++;
        existing.propertyCount += c.propertyCrime;
        existing.violentCount += c.violentCrime;
      } else {
        catMap.set(c.category, {
          category: c.category,
          count: 1,
          propertyCount: c.propertyCrime,
          violentCount: c.violentCrime
        });
      }
    }
    crimeByCategory = [...catMap.values()].sort((a, b) => b.count - a.count);
    totalCrimes = crimes.length;
    const violentCount = crimes.filter(c => c.violentCrime > 0).length;
    violentCrimeRate = totalCrimes > 0 ? Math.round((violentCount / totalCrimes) * 100) : 0;
  } else {
    console.error('Crime query failed:', (results[0] as PromiseRejectedResult).reason?.message);
  }

  // 311
  let avgCaseAgeDays: number | null = null;
  let top311Services: ServiceRequest311[] = [];
  if (results[1].status === 'fulfilled') {
    const rows = results[1].value;
    if (rows.length > 0) {
      const totalWeighted = rows.reduce((s: number, r: any) => s + Number(r.avg_case_age ?? 0) * Number(r.cnt), 0);
      const totalCount = rows.reduce((s: number, r: any) => s + Number(r.cnt), 0);
      avgCaseAgeDays = totalCount > 0 ? Math.round(totalWeighted / totalCount) : null;
      top311Services = rows.map((r: any) => ({
        serviceName: String(r.service_name ?? ''),
        count: Number(r.cnt)
      }));
    }
  } else {
    console.error('311 query failed:', (results[1] as PromiseRejectedResult).reason?.message);
  }

  // Streets
  let streetQuality: StreetQuality = { avgPCI: null, pciScope: 'citywide', pciDescription: 'No data', plannedRepairs: 0 };
  if (results[2].status === 'fulfilled') {
    streetQuality = results[2].value;
  } else {
    console.error('Street query failed:', (results[2] as PromiseRejectedResult).reason?.message);
  }

  // Composite glow
  let glowColor: 'green' | 'amber' | 'red';
  const crimeScore = violentCrimeRate <= 10 ? 2 : violentCrimeRate <= 20 ? 1 : 0;
  const serviceScore = avgCaseAgeDays !== null ? (avgCaseAgeDays <= 7 ? 2 : avgCaseAgeDays <= 30 ? 1 : 0) : 1;
  const streetScore = streetQuality.avgPCI !== null ? (streetQuality.avgPCI >= 70 ? 2 : streetQuality.avgPCI >= 50 ? 1 : 0) : 1;
  const composite = crimeScore + serviceScore + streetScore;
  if (composite >= 5) glowColor = 'green';
  else if (composite >= 3) glowColor = 'amber';
  else glowColor = 'red';

  const data: NeighborhoodData = {
    crimeByCategory,
    totalCrimes,
    violentCrimeRate,
    avgCaseAgeDays,
    top311Services,
    streetQuality
  };

  const narrative = await narrativize(ctx, 'neighborhood', businessType, address, data);

  return { data, narrative, glowColor };
}

async function queryStreetQuality(ctx: TraceContext, safeCommunity: string): Promise<StreetQuality> {
  // Try street_repairs for the community first
  const repairs = await query<any>(ctx, 'streetRepairs', `
    SELECT COUNT(*) AS planned_repairs
    FROM street_repairs
    WHERE community_planning_area ILIKE '%${safeCommunity}%'
  `);

  // Get average PCI from street_oci
  const pci = await query<any>(ctx, 'streetPCI', `
    SELECT AVG(pci) AS avg_pci FROM street_oci WHERE pci IS NOT NULL
  `);

  const avgPCI = pci[0]?.avg_pci !== null ? Math.round(Number(pci[0].avg_pci)) : null;
  const plannedRepairs = Number(repairs[0]?.planned_repairs ?? 0);

  let pciDescription = 'No data';
  if (avgPCI !== null) {
    if (avgPCI >= 80) pciDescription = 'Good';
    else if (avgPCI >= 60) pciDescription = 'Fair';
    else if (avgPCI >= 40) pciDescription = 'Poor';
    else pciDescription = 'Very Poor';
  }

  return { avgPCI, pciScope: 'citywide' as const, pciDescription, plannedRepairs };
}
