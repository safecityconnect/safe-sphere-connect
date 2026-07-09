import type { GeoPoint } from "@/lib/types/safe-walk";

const EARTH_RADIUS_METERS = 6_371_000;

/** Average human walking speed, used to estimate ETA when Directions is unavailable. */
const AVERAGE_WALKING_SPEED_MPS = 1.3;

export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateWalkingSeconds(meters: number): number {
  return meters / AVERAGE_WALKING_SPEED_MPS;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDurationShort(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs} hr ${remMins} min` : `${hrs} hr`;
}

export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * Reduces a dense route polyline to at most `maxPoints` points (always
 * keeping the first and last) so it stays cheap to store on a Firestore
 * document that's updated live during a walk.
 */
export function simplifyPath(path: GeoPoint[], maxPoints = 120): GeoPoint[] {
  if (path.length <= maxPoints) return path;

  const step = (path.length - 1) / (maxPoints - 1);
  const result: GeoPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(path[Math.round(i * step)]);
  }
  return result;
}
