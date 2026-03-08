import { traced, type TraceContext } from '../telemetry/trace.js';
import type { GeocodedLocation } from '../types/index.js';

const BASE = 'https://webmaps.sandiego.gov/arcgis/rest/services';

interface CrimeRecord {
  category: string;
  propertyCrime: number;
  violentCrime: number;
  occurredOn: number;
  neighborhood: string;
}

async function arcgisFetch(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const body = await res.json();
  if (body.error) throw new Error(`ArcGIS error ${body.error.code}: ${body.error.message}`);
  return body;
}

function geometryParam(lat: number, lng: number): string {
  return encodeURIComponent(JSON.stringify({
    x: lng, y: lat,
    spatialReference: { wkid: 4326 }
  }));
}

export async function geocode(ctx: TraceContext, address: string): Promise<GeocodedLocation> {
  return traced(ctx, 'arcgis', 'geocode', address, async () => {
    // Strip city/state/zip — the geocoder adds City=San Diego & Region=CA itself
    const streetOnly = address
      .replace(/,?\s*San\s+Diego\s*/i, '')
      .replace(/,?\s*CA\s*/i, '')
      .replace(/,?\s*\d{5}(-\d{4})?\s*$/, '')
      .replace(/,\s*$/, '')
      .trim();

    // Try structured first (Address + City + Region)
    const params = new URLSearchParams({
      Address: streetOnly,
      City: 'San Diego',
      Region: 'CA',
      outFields: '*',
      outSR: '4326',
      f: 'json'
    });
    let url = `${BASE}/Locators/PUD_CCS_Locator/GeocodeServer/findAddressCandidates?${params}`;
    let body = await arcgisFetch(url);
    let candidates = body.candidates;

    // Fallback: try SingleLine if structured fails
    if (!candidates || candidates.length === 0) {
      const slParams = new URLSearchParams({
        SingleLine: `${streetOnly}, San Diego, CA`,
        outFields: '*',
        outSR: '4326',
        f: 'json'
      });
      url = `${BASE}/Locators/PUD_CCS_Locator/GeocodeServer/findAddressCandidates?${slParams}`;
      body = await arcgisFetch(url);
      candidates = body.candidates;
    }

    // Fallback 2: Esri world geocoder scoped to San Diego
    if (!candidates || candidates.length === 0) {
      const worldParams = new URLSearchParams({
        SingleLine: `${streetOnly}, San Diego, CA`,
        outFields: '*',
        outSR: '4326',
        f: 'json',
        searchExtent: '-117.35,32.5,-116.9,33.15',  // San Diego bounding box
      });
      const worldUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${worldParams}`;
      body = await arcgisFetch(worldUrl);
      candidates = body.candidates?.filter((c: any) => c.score >= 80) ?? [];
    }

    if (!candidates || candidates.length === 0) {
      throw new Error(`Address not found in San Diego: "${address}". Try a nearby street number or verify the address exists.`);
    }
    const best = candidates[0];
    return {
      lat: best.location.y,
      lng: best.location.x,
      matchedAddress: best.address,
      score: best.score
    };
  });
}

export async function getZoning(ctx: TraceContext, lat: number, lng: number): Promise<{ zoneName: string }> {
  return traced(ctx, 'arcgis', 'getZoning', `${lat},${lng}`, async () => {
    const url = `${BASE}/DSD/Zoning_Base/MapServer/0/query?where=1%3D1&geometry=${geometryParam(lat, lng)}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outFields=ZONE_NAME&returnGeometry=false&f=json`;
    const body = await arcgisFetch(url);
    const features = body.features;
    if (!features || features.length === 0) {
      return { zoneName: 'UNKNOWN' };
    }
    return { zoneName: features[0].attributes.ZONE_NAME };
  });
}

export async function getCrime(
  ctx: TraceContext, lat: number, lng: number, radiusMeters: number, yearMin: number
): Promise<CrimeRecord[]> {
  return traced(ctx, 'arcgis', 'getCrime', `${lat},${lng} r=${radiusMeters}m`, async () => {
    const url = `${BASE}/SDPD/SDPD_NIBRS_Crime_Offenses_Geo/FeatureServer/0/query?where=year%3E%3D${yearMin}&geometry=${geometryParam(lat, lng)}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outFields=IBR_CATEGORY%2CPROPERTY_CRIME%2CVIOLENT_CRIME%2COCCURED_ON%2CNEIGHBORHOOD&returnGeometry=false&resultRecordCount=1000&f=json`;
    const body = await arcgisFetch(url);
    const features = body.features ?? [];
    return features.map((f: any) => ({
      category: f.attributes.IBR_CATEGORY,
      propertyCrime: f.attributes.PROPERTY_CRIME,
      violentCrime: f.attributes.VIOLENT_CRIME,
      occurredOn: f.attributes.OCCURED_ON,
      neighborhood: f.attributes.NEIGHBORHOOD
    }));
  });
}

export async function getCommunityPlan(ctx: TraceContext, lat: number, lng: number): Promise<{ cpName: string }> {
  return traced(ctx, 'arcgis', 'getCommunityPlan', `${lat},${lng}`, async () => {
    const url = `${BASE}/DSD/Planning/MapServer/2/query?where=1%3D1&geometry=${geometryParam(lat, lng)}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outFields=CPNAME&returnGeometry=false&f=json`;
    const body = await arcgisFetch(url);
    const features = body.features;
    if (!features || features.length === 0) {
      return { cpName: 'UNKNOWN' };
    }
    return { cpName: features[0].attributes.CPNAME };
  });
}
