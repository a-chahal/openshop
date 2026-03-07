import type { TraceContext } from '../telemetry/trace.js';
import type { ToolResult, PermitData, PermitExample } from '../types/index.js';
import { query } from '../data/motherduck.js';
import { sqlHaversine } from '../utils/haversine.js';
import { narrativize } from '../llm/client.js';

export async function permitRoadmap(
  ctx: TraceContext,
  lat: number,
  lng: number,
  communityPlanArea: string,
  approvalTypeKeywords: string[],
  businessType: string = '',
  address: string = ''
): Promise<ToolResult<PermitData>> {
  const keywordFilters = approvalTypeKeywords
    .map(k => `PROJECT_TITLE ILIKE '%${k.replace(/'/g, "''")}%'`)
    .join(' OR ');

  const haversine = sqlHaversine('LAT_JOB', 'LNG_JOB', lat, lng);
  const radiusMiles = 2;

  const [timeline, similar] = await Promise.all([
    query<any>(ctx, 'permitTimeline', `
      WITH nearby_permits AS (
        SELECT
          DATEDIFF('day', DATE_APPROVAL_CREATE, DATE_APPROVAL_ISSUE) AS days
        FROM permits_all
        WHERE LAT_JOB IS NOT NULL AND LNG_JOB IS NOT NULL
          AND DATE_APPROVAL_ISSUE IS NOT NULL
          AND DATE_APPROVAL_CREATE IS NOT NULL
          AND DATEDIFF('day', DATE_APPROVAL_CREATE, DATE_APPROVAL_ISSUE) > 0
          AND ${haversine} <= ${radiusMiles}
      )
      SELECT
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY days) AS p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY days) AS p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY days) AS p75,
        COUNT(*) AS total_permits
      FROM nearby_permits
    `),
    query<any>(ctx, 'similarProjects', `
      WITH nearby AS (
        SELECT
          PROJECT_ID,
          PROJECT_TITLE,
          APPROVAL_TYPE,
          DATEDIFF('day', DATE_APPROVAL_CREATE, DATE_APPROVAL_ISSUE) AS days_to_approval
        FROM permits_all
        WHERE LAT_JOB IS NOT NULL AND LNG_JOB IS NOT NULL
          AND DATE_APPROVAL_ISSUE IS NOT NULL
          AND DATE_APPROVAL_CREATE IS NOT NULL
          AND (${keywordFilters || '1=1'})
          AND DATEDIFF('day', DATE_APPROVAL_CREATE, DATE_APPROVAL_ISSUE) > 0
          AND ${haversine} <= ${radiusMiles}
      )
      SELECT * FROM nearby
      ORDER BY days_to_approval
      LIMIT 10
    `)
  ]);

  const t = timeline[0];
  const medianDays = Math.round(Number(t?.p50 ?? 0));
  const p25Days = Math.round(Number(t?.p25 ?? 0));
  const p75Days = Math.round(Number(t?.p75 ?? 0));
  const totalPermits = Number(t?.total_permits ?? 0);

  const similarProjects: PermitExample[] = similar.map((r: any) => ({
    projectId: String(r.PROJECT_ID ?? ''),
    projectTitle: String(r.PROJECT_TITLE ?? ''),
    approvalType: String(r.APPROVAL_TYPE ?? ''),
    daysToApproval: Number(r.days_to_approval ?? 0)
  }));

  let glowColor: 'green' | 'amber' | 'red';
  if (medianDays < 90) glowColor = 'green';
  else if (medianDays <= 180) glowColor = 'amber';
  else glowColor = 'red';

  const data: PermitData = {
    communityPlan: communityPlanArea,
    medianDays,
    p25Days,
    p75Days,
    totalPermits,
    similarProjects
  };

  const narrative = await narrativize(ctx, 'permits', businessType, address, data);

  return { data, narrative, glowColor };
}
