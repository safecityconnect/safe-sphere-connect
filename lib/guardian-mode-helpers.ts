import { haversineDistanceMeters } from "@/lib/map/geo";
import type { GeoPoint } from "@/lib/types/safe-walk";

/** Guardian Mode sessions share the `safeWalks` collection; Safe Walk lists skip them. */
export function isGuardianModeSession(data: { sessionType?: string }): boolean {
  return data.sessionType === "guardian-mode";
}

/** Location writes are throttled to save quota and battery (same cadence as Safe Walk). */
export const GUARDIAN_MIN_WRITE_DISTANCE_METERS = 8;
export const GUARDIAN_MIN_WRITE_INTERVAL_MS = 8_000;

export function shouldWriteGuardianLocation(
  last: { location: GeoPoint; time: number } | null,
  next: GeoPoint,
  now: number
): boolean {
  if (!last) return true;
  return (
    haversineDistanceMeters(last.location, next) >= GUARDIAN_MIN_WRITE_DISTANCE_METERS ||
    now - last.time >= GUARDIAN_MIN_WRITE_INTERVAL_MS
  );
}

/** "just now" / "42s ago" / "3m ago" for the last location update. */
export function formatLocationAge(updatedAt: Date | null, now: number): string {
  if (!updatedAt) return "waiting for first update";
  const seconds = Math.max(0, Math.floor((now - updatedAt.getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
