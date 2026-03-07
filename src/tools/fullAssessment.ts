import type { TraceContext } from '../telemetry/trace.js';
import type { ToolResult, AssessmentData } from '../types/index.js';
import { geocode, getCommunityPlan } from '../data/arcgis.js';
import { checkZoning } from './checkZoning.js';
import { competitiveLandscape } from './competitiveLandscape.js';
import { footTraffic } from './footTraffic.js';
import { permitRoadmap } from './permitRoadmap.js';
import { neighborhoodProfile } from './neighborhoodProfile.js';

export async function fullAssessment(
  ctx: TraceContext,
  address: string,
  businessType: string,
  naicsCodes: number[]
): Promise<ToolResult<AssessmentData>> {
  // Geocode once at the top
  const location = await geocode(ctx, address);
  const community = await getCommunityPlan(ctx, location.lat, location.lng);
  const communityName = community.cpName;

  // Run all 5 tools in parallel with allSettled
  const results = await Promise.allSettled([
    checkZoning(ctx, address, businessType, location.lat, location.lng, communityName),
    competitiveLandscape(ctx, location.lat, location.lng, naicsCodes, 0.5, businessType, address),
    footTraffic(ctx, location.lat, location.lng, 0.3, businessType, address),
    permitRoadmap(ctx, location.lat, location.lng, communityName, [businessType], businessType, address),
    neighborhoodProfile(ctx, location.lat, location.lng, communityName, businessType, address)
  ]);

  const extract = <T>(r: PromiseSettledResult<ToolResult<T>>, label: string): ToolResult<T> | null => {
    if (r.status === 'fulfilled') return r.value;
    console.error(`${label} failed:`, (r as PromiseRejectedResult).reason?.message);
    return null;
  };

  const zoning = extract(results[0], 'checkZoning');
  const competition = extract(results[1], 'competitiveLandscape');
  const traffic = extract(results[2], 'footTraffic');
  const permits = extract(results[3], 'permitRoadmap');
  const neighborhood = extract(results[4], 'neighborhoodProfile');

  // Worst glow color from successful sub-results
  const colorPriority = { red: 0, amber: 1, neutral: 2, green: 3 };
  const subColors = [zoning, competition, traffic, permits, neighborhood]
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map(r => r.glowColor);

  let glowColor: 'green' | 'amber' | 'red' | 'neutral' = 'neutral';
  if (subColors.length > 0) {
    glowColor = subColors.reduce((worst, c) =>
      colorPriority[c] < colorPriority[worst] ? c : worst
    );
  }
  // If any sub-tool failed entirely, degrade to at least amber
  const anyFailed = [zoning, competition, traffic, permits, neighborhood].some(r => r === null);
  if (anyFailed && colorPriority[glowColor] > colorPriority['amber']) {
    glowColor = 'amber';
  }

  return {
    data: {
      location,
      communityPlan: communityName,
      zoning,
      competition,
      footTraffic: traffic,
      permits,
      neighborhood
    },
    narrative: '',
    glowColor
  };
}
