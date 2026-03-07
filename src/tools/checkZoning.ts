import type { TraceContext } from '../telemetry/trace.js';
import type { ToolResult, ZoningData } from '../types/index.js';
import { geocode, getZoning, getCommunityPlan } from '../data/arcgis.js';
import { lookupZoneUse, lookupZonePrefix } from '../data/zoning-lookup.js';
import { mapBusinessType, type BusinessMapping } from '../llm/business-mapper.js';
import { narrativize } from '../llm/client.js';

export async function checkZoning(
  ctx: TraceContext,
  address: string,
  businessType: string,
  preGeoLat?: number,
  preGeoLng?: number,
  preCommunityName?: string,
  preMapping?: BusinessMapping
): Promise<ToolResult<ZoningData>> {
  let lat: number, lng: number, matchedAddress: string, score: number;

  if (preGeoLat !== undefined && preGeoLng !== undefined) {
    lat = preGeoLat;
    lng = preGeoLng;
    matchedAddress = address;
    score = 100;
  } else {
    const geo = await geocode(ctx, address);
    lat = geo.lat;
    lng = geo.lng;
    matchedAddress = geo.matchedAddress;
    score = geo.score;
  }

  // Get business mapping + zoning data in parallel
  const mappingPromise = preMapping ? Promise.resolve(preMapping) : mapBusinessType(ctx, businessType);
  const zoningPromise = getZoning(ctx, lat, lng);
  const communityPromise = preCommunityName
    ? Promise.resolve({ cpName: preCommunityName })
    : getCommunityPlan(ctx, lat, lng);

  const [mapping, zoning, community] = await Promise.all([
    mappingPromise, zoningPromise, communityPromise
  ]);

  // Full zoning table lookup
  const detailed = lookupZoneUse(zoning.zoneName, mapping.primaryCategory);

  let glowColor: 'green' | 'amber' | 'red';
  if (detailed.designation === 'P') {
    glowColor = 'green';
  } else if (detailed.designation === 'L' || detailed.designation === 'C' || detailed.designation === 'N') {
    glowColor = 'amber';
  } else if (detailed.designation === '-') {
    glowColor = 'red';
  } else {
    // Fallback to prefix-based
    const prefix = lookupZonePrefix(zoning.zoneName);
    glowColor = prefix.category === 'commercial' ? 'green' :
                prefix.category === 'residential' ? 'red' : 'amber';
  }

  const data: ZoningData = {
    location: { lat, lng, matchedAddress, score },
    zoneName: zoning.zoneName,
    communityPlan: community.cpName,
    zoneCategory: detailed.category,
    useCategory: mapping.primaryCategory,
    designation: detailed.designation,
    designationMeaning: detailed.designationMeaning,
    naicsCodes: mapping.naicsCodes,
    verdict: detailed.verdict
  };

  const narrative = await narrativize(ctx, 'zoning', businessType, address, data);

  return { data, narrative, glowColor };
}
