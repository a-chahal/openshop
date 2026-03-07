import type { TraceContext } from '../telemetry/trace.js';
import type { ToolResult, FootTrafficData, MeterActivity } from '../types/index.js';
import { query } from '../data/motherduck.js';
import { sqlHaversine } from '../utils/haversine.js';
import { narrativize } from '../llm/client.js';

export async function footTraffic(
  ctx: TraceContext,
  lat: number,
  lng: number,
  radiusMiles: number,
  businessType: string = '',
  address: string = ''
): Promise<ToolResult<FootTrafficData>> {
  const meterHaversine = sqlHaversine('ml.latitude', 'ml.longitude', lat, lng);
  const transitHaversine = sqlHaversine('lat', 'lng', lat, lng);

  const [meterData, citywideAvg, transitStops] = await Promise.all([
    query<any>(ctx, 'nearbyMeters', `
      WITH nearby_meters AS (
        SELECT
          ml.pole,
          ${meterHaversine} AS distance_miles
        FROM meter_locations ml
        WHERE ml.latitude IS NOT NULL AND ml.longitude IS NOT NULL
      ),
      filtered AS (
        SELECT * FROM nearby_meters WHERE distance_miles <= ${radiusMiles}
      )
      SELECT
        f.pole,
        f.distance_miles,
        COALESCE(SUM(mt.num_trans), 0) AS total_transactions,
        COALESCE(SUM(mt.sum_trans_amt), 0) AS total_revenue,
        COALESCE(AVG(mt.num_trans), 0) AS monthly_avg
      FROM filtered f
      LEFT JOIN meter_txns mt ON f.pole = mt.pole_id
      GROUP BY f.pole, f.distance_miles
      ORDER BY f.distance_miles
    `),
    query<any>(ctx, 'citywideAvg', `
      SELECT AVG(monthly_total) AS avg_monthly
      FROM (
        SELECT pole_id, SUM(num_trans) / NULLIF(COUNT(DISTINCT month), 0) AS monthly_total
        FROM meter_txns
        GROUP BY pole_id
      )
    `),
    query<any>(ctx, 'transitStops', `
      WITH nearby AS (
        SELECT stop_name, ${transitHaversine} AS distance_miles
        FROM transit_stops
        WHERE lat IS NOT NULL AND lng IS NOT NULL
      )
      SELECT COUNT(*) AS cnt FROM nearby WHERE distance_miles <= ${radiusMiles}
    `)
  ]);

  const nearbyMeters: MeterActivity[] = meterData.map((r: any) => ({
    pole: String(r.pole),
    distanceMiles: Number(Number(r.distance_miles).toFixed(3)),
    totalTransactions: Number(r.total_transactions),
    totalRevenue: Number(r.total_revenue),
    monthlyAvg: Number(Number(r.monthly_avg).toFixed(1))
  }));

  const totalTransactions = nearbyMeters.reduce((s, m) => s + m.totalTransactions, 0);
  const avgMonthlyLocal = nearbyMeters.length > 0
    ? nearbyMeters.reduce((s, m) => s + m.monthlyAvg, 0) / nearbyMeters.length
    : 0;
  const citywideMonthly = Number(citywideAvg[0]?.avg_monthly ?? 0);
  const pctOfCitywide = citywideMonthly > 0
    ? Math.round((avgMonthlyLocal / citywideMonthly) * 100)
    : 0;

  const nearbyTransitStops = Number(transitStops[0]?.cnt ?? 0);

  let glowColor: 'green' | 'amber' | 'red';
  if (pctOfCitywide >= 120) glowColor = 'green';
  else if (pctOfCitywide >= 80) glowColor = 'amber';
  else glowColor = 'red';

  const data: FootTrafficData = {
    nearbyMeters,
    totalTransactions,
    avgMonthlyTransactions: Math.round(avgMonthlyLocal),
    citywideAvgMonthly: Math.round(citywideMonthly),
    pctOfCitywideAvg: pctOfCitywide,
    nearbyTransitStops
  };

  const narrative = await narrativize(ctx, 'footTraffic', businessType, address, data);

  return { data, narrative, glowColor };
}
