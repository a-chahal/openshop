export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3961;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function sqlHaversine(latCol: string, lngCol: string, lat: number, lng: number): string {
  return `(2 * 3961 * ASIN(SQRT(
    POWER(SIN(RADIANS(${latCol} - ${lat}) / 2), 2) +
    COS(RADIANS(${lat})) * COS(RADIANS(${latCol})) *
    POWER(SIN(RADIANS(${lngCol} - ${lng}) / 2), 2)
  )))`;
}
