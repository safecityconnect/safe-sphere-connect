import { distancePointToPathMeters } from "@/lib/map/geo";
import type { GeoPoint } from "@/lib/types/safe-walk";

/**
 * Community-reported safety concerns from our teacher safety survey.
 *
 * This is a separate evidence source. It is kept apart from app-verified
 * incidents (Area Health) and is never used in route safety scores or route
 * ranking — Safe Walk only displays it, with its source and limitations.
 */

/**
 * How close a mapped concern must be to a route for Safe Walk to list it
 * alongside that route. This is a display-matching choice only: it is not a
 * safety threshold and does not affect any score or route choice.
 */
export const COMMUNITY_CONCERN_DISPLAY_RADIUS_METERS = 300;

/** The reason respondents gave, as grouped in the compiled survey list. Display only. */
export type CommunityConcernCategory =
  | "poor-lighting-isolated"
  | "maintenance-infrastructure"
  | "crime-related"
  | "no-specific-reason";

export const COMMUNITY_CONCERN_CATEGORY_LABELS: Record<CommunityConcernCategory, string> = {
  "poor-lighting-isolated": "Poor lighting / isolated",
  "maintenance-infrastructure": "Maintenance / infrastructure",
  "crime-related": "Crime-related concern reported",
  "no-specific-reason": "No specific reason given",
};

export type CommunityConcern = {
  id: string;
  /** The place as respondents named it. */
  placeName: string;
  city: string;
  /** Display only; never used in scoring. */
  categories: CommunityConcernCategory[];
  /** A note carried over from the compiled list, e.g. an unresolved detail. Not displayed. */
  sourceNote?: string;
  /**
   * Exact number of teachers who independently named this place, as
   * substantiated by the survey notes. `null` means not yet confirmed —
   * never estimate this.
   */
  independentMentions: number | null;
  /**
   * Confirmed coordinates only. Leave unset until confirmed; unmapped
   * concerns are never matched to a route.
   */
  location?: GeoPoint;
};

export const COMMUNITY_SURVEY_SOURCE = {
  label: "Community safety survey (teachers)",
  method:
    "Teachers were asked independently where they felt unsafe. No compiled list of places was shown to them.",
  limitations:
    "These are community-reported concerns, not verified incidents or official crime statistics, and they are not used in the safety score. Places not mentioned may still be unsafe.",
  /** Add only from the survey records; shown only when set. */
  conductedOn: null as string | null,
};

/**
 * Survey entries. The compiled teacher survey list is kept out of the public
 * repository; add entries only from the survey records. Use exact independent
 * mention counts when substantiated (otherwise null) and confirmed coordinates
 * only.
 */
export const COMMUNITY_CONCERNS: CommunityConcern[] = [];

export type CommunityConcernMatch = {
  concern: CommunityConcern;
  distanceMeters: number;
};

function hasConfirmedLocation(
  concern: CommunityConcern
): concern is CommunityConcern & { location: GeoPoint } {
  return (
    concern.location !== undefined &&
    Number.isFinite(concern.location.lat) &&
    Number.isFinite(concern.location.lng)
  );
}

/** Mapped concerns within the display radius of a route, nearest first. */
export function communityConcernsNearRoute(
  path: GeoPoint[],
  concerns: CommunityConcern[] = COMMUNITY_CONCERNS,
  radiusMeters: number = COMMUNITY_CONCERN_DISPLAY_RADIUS_METERS
): CommunityConcernMatch[] {
  if (path.length === 0) return [];
  return concerns
    .filter(hasConfirmedLocation)
    .map((concern) => ({
      concern,
      distanceMeters: distancePointToPathMeters(concern.location, path),
    }))
    .filter((match) => match.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/** Concerns that cannot be shown on routes until their location is confirmed. */
export function unmappedCommunityConcerns(
  concerns: CommunityConcern[] = COMMUNITY_CONCERNS
): CommunityConcern[] {
  return concerns.filter((concern) => !hasConfirmedLocation(concern));
}

export function hasMappedCommunityConcerns(
  concerns: CommunityConcern[] = COMMUNITY_CONCERNS
): boolean {
  return concerns.some(hasConfirmedLocation);
}

/** Corroboration wording using only the recorded count. */
export function describeMentions(concern: CommunityConcern): string {
  const count = concern.independentMentions;
  if (count === null || !Number.isInteger(count) || count < 1) {
    return "Number of teachers not yet confirmed";
  }
  return count === 1 ? "Named by 1 teacher" : `Named independently by ${count} teachers`;
}
