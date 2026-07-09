import type { Timestamp } from "firebase/firestore";

export type GeoPoint = { lat: number; lng: number };

export type SafeWalkDestination = GeoPoint & { address: string };

export type SafeWalkStatus = "active" | "completed" | "cancelled";

/**
 * Why a walk stopped being active. "arrived" is set automatically once GPS
 * shows the walker within range of the destination; the other two are
 * explicit walker actions.
 */
export type SafeWalkEndReason = "arrived" | "ended_by_walker" | "cancelled";

export type SafeWalkGuardian = {
  uid: string;
  name: string;
};

/**
 * A single Safe Walk / Guardian Journey session, stored in the `safeWalks`
 * Firestore collection. Guardians are resolved once at start time from the
 * walker's linked family members (see `getSafeWalkGuardians`) and stored as
 * `guardianIds` so a guardian's live-tracking query doesn't need to touch
 * `familyLinks` at all.
 */
export type SafeWalkDoc = {
  id: string;
  walkerId: string;
  walkerName: string;
  status: SafeWalkStatus;
  origin: GeoPoint;
  destination: SafeWalkDestination;
  /** Simplified walking route polyline, from origin to destination. */
  routePath: GeoPoint[];
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  currentLocation: GeoPoint;
  locationUpdatedAt: Timestamp | null;
  /** 0-100, derived from remaining distance to destination. */
  progressPercent: number;
  guardianIds: string[];
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
  endReason: SafeWalkEndReason | null;
  createdAt: Timestamp | null;
};
