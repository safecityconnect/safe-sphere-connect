import type {
  AreaHealthSnapshot,
  SafetyRiskLevel,
  SectorHealth,
} from "@/lib/area-health";
import { riskLevelForScore } from "@/lib/area-health";
import { distancePointToPathMeters } from "@/lib/map/geo";
import type { GeoPoint } from "@/lib/types/safe-walk";

export type RouteSafetyCandidate = {
  id: string;
  path: GeoPoint[];
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  provider: "google-directions" | "straight-line-estimate" | string;
  /** Addresses or sector names known to be on the route. */
  sectorHints?: string[];
};

/**
 * Where a route's safety score comes from:
 * - "nearby-reports": verified Area Health sectors within range of the route.
 * - "citywide-fallback": no verified sector near the route, so `safetyScore`
 *   is the citywide average. The route's own safety is unknown.
 * - "no-reports": there are no verified reports anywhere yet.
 */
export type ScoreBasis = "nearby-reports" | "citywide-fallback" | "no-reports";

export type NearbySector = {
  key: string;
  sector: string;
  city: string;
  score: number;
  riskLevel: SafetyRiskLevel;
  /** Closest distance from the route path, or null when matched only by address text. */
  distanceMeters: number | null;
  incidentCount: number;
  infrastructureReportCount: number;
};

export type SafeRouteRecommendation = {
  candidateId: string;
  safetyScore: number;
  riskLevel: SafetyRiskLevel;
  distanceText: string;
  durationText: string;
  sectorKeys: string[];
  /** True only when verified reports exist near this route (scoreBasis "nearby-reports"). */
  hasSafetyData: boolean;
  scoreBasis: ScoreBasis;
  /** Up to three sectors that influenced the score, nearest first. */
  nearbySectors: NearbySector[];
  /** Plain-language statement of the data behind this route's score. */
  evidence: string;
  explanation: string;
};

export type RouteComparisonRow = {
  candidateId: string;
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  safetyScore: number;
  riskLevel: SafetyRiskLevel;
  scoreBasis: ScoreBasis;
  eligible: boolean;
  ineligibleReason: string | null;
  isSelected: boolean;
  isFastest: boolean;
  utility: number;
};

export type SafeRouteSelection = {
  selected: SafeRouteRecommendation;
  selectedCandidate: RouteSafetyCandidate;
  fastestCandidate: RouteSafetyCandidate;
  fastestRecommendation: SafeRouteRecommendation;
  comparisons: RouteComparisonRow[];
  comparedMultiple: boolean;
  reason: string;
};

const SECTOR_ROUTE_RADIUS_METERS = 2_500;
/** Corridor used to decide whether a route actually passes a sector. */
const SECTOR_ALONG_ROUTE_METERS = 900;
const MAX_SAFE_DETOUR_DISTANCE_RATIO = 1.35;
const MAX_SAFE_DETOUR_DURATION_RATIO = 1.4;
/** 10% extra distance/time costs about 2.2 safety points. */
const DETOUR_PENALTY_PER_FULL_RATIO = 22;
const MARGINAL_SAFETY_POINTS = 3;
const MAX_EVIDENCE_SECTORS = 3;

function nearestPathDistance(sector: SectorHealth, path: GeoPoint[]): number | null {
  if (sector.latitude === undefined || sector.longitude === undefined) return null;
  return distancePointToPathMeters(
    { lat: sector.latitude, lng: sector.longitude },
    path
  );
}

function sectorsAlongPath(
  path: GeoPoint[],
  sectors: SectorHealth[],
  radiusMeters = SECTOR_ALONG_ROUTE_METERS
): SectorHealth[] {
  return sectors.filter((sector) => {
    const distance = nearestPathDistance(sector, path);
    return distance !== null && distance <= radiusMeters;
  });
}

function extraPercent(value: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return Math.round(((value - baseline) / baseline) * 100);
}

/**
 * Scores any route candidate against the same sector model used by Area
 * Health. Google Directions is the only candidate provider today; future
 * optimizers can submit alternate candidates here and rank them without
 * changing Safe Walk's presentation layer.
 */
export function evaluateRouteSafety(
  candidate: RouteSafetyCandidate,
  areaHealth: AreaHealthSnapshot
): SafeRouteRecommendation {
  const normalizedHints = candidate.sectorHints?.map((hint) => hint.toLowerCase()) ?? [];
  const nearby = areaHealth.sectors
    .map((sector) => {
      const matchedByAddress = normalizedHints.some(
        (hint) =>
          hint.includes(sector.sector.toLowerCase()) &&
          hint.includes(sector.city.toLowerCase())
      );
      return {
        sector,
        matchedByAddress,
        distance: matchedByAddress ? 250 : nearestPathDistance(sector, candidate.path),
      };
    })
    .filter(
      (
        item
      ): item is {
        sector: SectorHealth;
        matchedByAddress: boolean;
        distance: number;
      } => item.distance !== null && item.distance <= SECTOR_ROUTE_RADIUS_METERS
    );

  const scoreBasis: ScoreBasis =
    areaHealth.reportCount === 0
      ? "no-reports"
      : nearby.length > 0
        ? "nearby-reports"
        : "citywide-fallback";

  const nearbySectors: NearbySector[] = [...nearby]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_EVIDENCE_SECTORS)
    .map((item) => ({
      key: item.sector.key,
      sector: item.sector.sector,
      city: item.sector.city,
      score: item.sector.score,
      riskLevel: item.sector.riskLevel,
      distanceMeters: item.matchedByAddress ? null : Math.round(item.distance),
      incidentCount: item.sector.incidentCount,
      infrastructureReportCount: item.sector.infrastructureReportCount,
    }));

  const totalWeight = nearby.reduce(
    (sum, item) => sum + 1 / Math.max(250, item.distance),
    0
  );
  const safetyScore =
    totalWeight > 0
      ? Math.round(
          nearby.reduce(
            (sum, item) =>
              sum + item.sector.score / Math.max(250, item.distance),
            0
          ) / totalWeight
        )
      : areaHealth.overallScore;

  const along = nearby
    .filter((item) => item.distance <= SECTOR_ALONG_ROUTE_METERS)
    .sort((a, b) => a.sector.score - b.sector.score);
  const alongLabel = along
    .slice(0, 3)
    .map((item) => `${item.sector.sector} (${item.sector.score})`)
    .join(", ");

  const evidence = describeEvidence(scoreBasis, nearbySectors);

  return {
    candidateId: candidate.id,
    safetyScore,
    riskLevel: riskLevelForScore(safetyScore),
    distanceText: candidate.distanceText,
    durationText: candidate.durationText,
    sectorKeys: nearby.map((item) => item.sector.key),
    hasSafetyData: scoreBasis === "nearby-reports",
    scoreBasis,
    nearbySectors,
    evidence,
    explanation:
      scoreBasis === "nearby-reports"
        ? alongLabel
          ? `Rates this route using Area Health scores along ${alongLabel}.`
          : "Rates this route using verified reports within 2.5 km of its path."
        : evidence,
  };
}

function reportCountLabel(sector: NearbySector): string {
  const parts = [
    sector.incidentCount > 0
      ? `${sector.incidentCount} incident${sector.incidentCount === 1 ? "" : "s"}`
      : null,
    sector.infrastructureReportCount > 0
      ? `${sector.infrastructureReportCount} civic report${
          sector.infrastructureReportCount === 1 ? "" : "s"
        }`
      : null,
  ].filter((part): part is string => part !== null);
  return parts.join(" and ") || "verified reports";
}

function describeEvidence(scoreBasis: ScoreBasis, sectors: NearbySector[]): string {
  if (scoreBasis === "no-reports") {
    return "No verified reports are available yet, so this route's safety is unknown.";
  }
  if (scoreBasis === "citywide-fallback") {
    return "No verified reports within 2.5 km of this route, so its safety is unknown. This does not mean the area is safe.";
  }
  const details = sectors.map((sector) => {
    const where =
      sector.distanceMeters === null
        ? "matched by destination address"
        : `${(sector.distanceMeters / 1000).toFixed(1)} km from route`;
    return `${sector.sector}, ${sector.city}: ${sector.score}/100 (${reportCountLabel(sector)}, ${where})`;
  });
  return `Based on verified app reports near this route: ${details.join("; ")}.`;
}

export function rankRouteCandidates(
  candidates: RouteSafetyCandidate[],
  areaHealth: AreaHealthSnapshot
): SafeRouteRecommendation[] {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  return candidates
    .map((candidate) => evaluateRouteSafety(candidate, areaHealth))
    .sort((a, b) => {
      const scoreDelta = b.safetyScore - a.safetyScore;
      if (scoreDelta !== 0) return scoreDelta;
      const durationA = byId.get(a.candidateId)?.durationSeconds ?? 0;
      const durationB = byId.get(b.candidateId)?.durationSeconds ?? 0;
      return durationA - durationB;
    });
}

function ineligibleReason(
  candidate: RouteSafetyCandidate,
  minDistance: number,
  minDuration: number
): string | null {
  const tooFar =
    minDistance > 0 && candidate.distanceMeters > minDistance * MAX_SAFE_DETOUR_DISTANCE_RATIO;
  const tooSlow =
    minDuration > 0 && candidate.durationSeconds > minDuration * MAX_SAFE_DETOUR_DURATION_RATIO;
  if (!tooFar && !tooSlow) return null;

  const parts: string[] = [];
  if (tooFar) {
    parts.push(`${extraPercent(candidate.distanceMeters, minDistance)}% longer than the shortest`);
  }
  if (tooSlow) {
    parts.push(`${extraPercent(candidate.durationSeconds, minDuration)}% slower than the fastest`);
  }
  return `Detour too large (${parts.join(", ")})`;
}

function avoidedHighRiskSectors(
  selectedPath: GeoPoint[],
  fastestPath: GeoPoint[],
  sectors: SectorHealth[]
): SectorHealth[] {
  const selectedKeys = new Set(
    sectorsAlongPath(selectedPath, sectors).map((sector) => sector.key)
  );
  return sectorsAlongPath(fastestPath, sectors).filter(
    (sector) =>
      !selectedKeys.has(sector.key) &&
      (sector.riskLevel === "High" || sector.riskLevel === "Critical")
  );
}

function buildSelectionReason(params: {
  candidateCount: number;
  selected: SafeRouteRecommendation;
  selectedCandidate: RouteSafetyCandidate;
  fastest: SafeRouteRecommendation;
  fastestCandidate: RouteSafetyCandidate;
  saferButIneligible: RouteComparisonRow[];
  avoided: SectorHealth[];
  /** Candidates whose safety is unknown (no verified reports near them). */
  unknownCount: number;
}): string {
  const {
    candidateCount,
    selected,
    selectedCandidate,
    fastest,
    fastestCandidate,
    saferButIneligible,
    avoided,
    unknownCount,
  } = params;

  if (candidateCount <= 1) {
    if (selected.scoreBasis === "nearby-reports") {
      return "Google returned one walking route. It is scored with verified reports near its actual path.";
    }
    return selected.scoreBasis === "no-reports"
      ? "Google returned one walking route. No verified Area Health reports are available yet."
      : "Google returned one walking route. No verified reports are near it, so its safety is unknown.";
  }

  if (selected.scoreBasis === "no-reports") {
    return "Compared Google walking alternatives, but no verified Area Health reports are available yet, so the fastest route is recommended.";
  }

  if (unknownCount === candidateCount) {
    return `Compared ${candidateCount} Google walking routes. None pass near verified reports, so their safety is unknown and they were compared on distance and time only.`;
  }

  const selectedKnown = selected.scoreBasis === "nearby-reports";
  const fastestKnown = fastest.scoreBasis === "nearby-reports";

  const extraDistance = extraPercent(
    selectedCandidate.distanceMeters,
    fastestCandidate.distanceMeters
  );
  const extraDuration = extraPercent(
    selectedCandidate.durationSeconds,
    fastestCandidate.durationSeconds
  );
  const safetyDelta = selected.safetyScore - fastest.safetyScore;
  const avoidedLabel = avoided
    .slice(0, 2)
    .map((sector) => `${sector.sector} (${sector.riskLevel} risk)`)
    .join(" and ");

  if (selected.candidateId === fastest.candidateId) {
    if (saferButIneligible.length > 0) {
      const safer = saferButIneligible[0];
      return `Compared ${candidateCount} Google walking routes. A safer option scored ${safer.safetyScore}/100 but was not used because the extra distance/time is too large.`;
    }
    if (!selectedKnown) {
      return `Compared ${candidateCount} Google walking routes. The fastest route is recommended, but no verified reports are near it, so its safety is unknown.`;
    }
    if (unknownCount > 0) {
      return `Compared ${candidateCount} Google walking routes. The fastest route is recommended. ${unknownCount} of the alternatives ${
        unknownCount === 1 ? "has" : "have"
      } no verified reports nearby, so ${unknownCount === 1 ? "its" : "their"} safety is unknown.`;
    }
    if (Math.abs(safetyDelta) <= MARGINAL_SAFETY_POINTS) {
      return `Compared ${candidateCount} Google walking routes. Safety is similar across reasonable options, so the fastest walking route is recommended.`;
    }
    return `Compared ${candidateCount} Google walking routes. This path has the best safety for a reasonable walking distance.`;
  }

  const detourBits = [
    extraDistance > 0 ? `${extraDistance}% extra distance` : null,
    extraDuration > 0 ? `${extraDuration}% extra time` : null,
  ].filter((bit): bit is string => bit !== null);
  const detourText = detourBits.length > 0 ? `with ${detourBits.join(" and ")}` : "with no extra walking";
  const avoidText = avoidedLabel
    ? ` Its geometry stays farther from ${avoidedLabel} than the fastest route.`
    : "";

  if (!selectedKnown && fastestKnown) {
    const passed = fastest.nearbySectors[0];
    const passedLabel = passed ? ` near ${passed.sector} (${passed.score}/100)` : "";
    return `Selected over the fastest walking route, which passes${passedLabel}, ${detourText}. No verified reports are near this route, so its safety is unknown.${avoidText}`;
  }
  if (!selectedKnown && !fastestKnown) {
    return `Selected over the fastest walking route ${detourText}. Neither route has verified reports nearby, so their safety is unknown.${avoidText}`;
  }
  if (selectedKnown && !fastestKnown) {
    return `Selected over the fastest walking route ${detourText}. This route scores ${selected.safetyScore}/100 from verified reports nearby; the fastest route has no verified reports nearby, so its safety is unknown.${avoidText}`;
  }

  return `Selected over the fastest walking route because safety is ${selected.safetyScore}/100 vs ${fastest.safetyScore}/100 (${safetyDelta >= 0 ? "+" : ""}${safetyDelta} points) ${detourText}.${avoidText}`;
}

function candidateUtility(
  candidate: RouteSafetyCandidate,
  safetyScore: number,
  minDistance: number,
  minDuration: number
): number {
  const extraDistanceRatio =
    minDistance > 0 ? Math.max(0, candidate.distanceMeters / minDistance - 1) : 0;
  const extraDurationRatio =
    minDuration > 0 ? Math.max(0, candidate.durationSeconds / minDuration - 1) : 0;
  return (
    safetyScore - DETOUR_PENALTY_PER_FULL_RATIO * Math.max(extraDistanceRatio, extraDurationRatio)
  );
}

/**
 * Picks the safest reasonable walking route among Google alternatives.
 * Safety is the primary factor; distance/time veto absurd detours and break ties.
 */
export function selectSafestReasonableRoute(
  candidates: RouteSafetyCandidate[],
  areaHealth: AreaHealthSnapshot
): SafeRouteSelection | null {
  if (candidates.length === 0) return null;

  const scored = candidates.map((candidate) => ({
    candidate,
    recommendation: evaluateRouteSafety(candidate, areaHealth),
  }));

  const minDistance = Math.min(...candidates.map((candidate) => candidate.distanceMeters));
  const minDuration = Math.min(...candidates.map((candidate) => candidate.durationSeconds));
  const fastestEntry = [...scored].sort(
    (a, b) =>
      a.candidate.durationSeconds - b.candidate.durationSeconds ||
      a.candidate.distanceMeters - b.candidate.distanceMeters
  )[0];

  const rows: RouteComparisonRow[] = scored.map((entry) => {
    const reason = ineligibleReason(entry.candidate, minDistance, minDuration);
    return {
      candidateId: entry.candidate.id,
      distanceMeters: entry.candidate.distanceMeters,
      distanceText: entry.candidate.distanceText,
      durationSeconds: entry.candidate.durationSeconds,
      durationText: entry.candidate.durationText,
      safetyScore: entry.recommendation.safetyScore,
      riskLevel: entry.recommendation.riskLevel,
      scoreBasis: entry.recommendation.scoreBasis,
      eligible: reason === null,
      ineligibleReason: reason,
      isSelected: false,
      isFastest: entry.candidate.id === fastestEntry.candidate.id,
      utility: candidateUtility(
        entry.candidate,
        entry.recommendation.safetyScore,
        minDistance,
        minDuration
      ),
    };
  });

  const eligible = rows.filter((row) => row.eligible);
  const pool = eligible.length > 0 ? eligible : rows;
  const winnerRow = [...pool].sort(
    (a, b) =>
      b.utility - a.utility ||
      b.safetyScore - a.safetyScore ||
      a.durationSeconds - b.durationSeconds
  )[0];

  const winner = scored.find((entry) => entry.candidate.id === winnerRow.candidateId)!;
  const comparisons = rows.map((row) => ({
    ...row,
    isSelected: row.candidateId === winner.candidate.id,
  }));

  const avoided = avoidedHighRiskSectors(
    winner.candidate.path,
    fastestEntry.candidate.path,
    areaHealth.sectors
  );
  // Only routes with nearby verified reports can be called "safer".
  const saferButIneligible = comparisons.filter(
    (row) =>
      !row.eligible &&
      row.scoreBasis === "nearby-reports" &&
      row.safetyScore > winner.recommendation.safetyScore + MARGINAL_SAFETY_POINTS
  );
  const reason = buildSelectionReason({
    candidateCount: candidates.length,
    selected: winner.recommendation,
    selectedCandidate: winner.candidate,
    fastest: fastestEntry.recommendation,
    fastestCandidate: fastestEntry.candidate,
    saferButIneligible,
    avoided,
    unknownCount: rows.filter((row) => row.scoreBasis !== "nearby-reports").length,
  });

  return {
    selected: { ...winner.recommendation, explanation: reason },
    selectedCandidate: winner.candidate,
    fastestCandidate: fastestEntry.candidate,
    fastestRecommendation: fastestEntry.recommendation,
    comparisons,
    comparedMultiple: candidates.length > 1,
    reason,
  };
}

export function formatRouteSelectionDebug(selection: SafeRouteSelection): string {
  const lines = [
    `[Safe Route] candidates: ${selection.comparisons.length}`,
    ...selection.comparisons.map((row) => {
      const tags = [
        row.isSelected ? "SELECTED" : null,
        row.isFastest ? "FASTEST" : null,
        row.eligible ? null : row.ineligibleReason,
      ].filter((tag): tag is string => Boolean(tag));
      const safety =
        row.scoreBasis === "nearby-reports"
          ? `safety ${row.safetyScore}/100`
          : `safety unknown (${row.scoreBasis}, ranked as ${row.safetyScore})`;
      return `  ${row.candidateId}  ${row.distanceText}  ${row.durationText}  ${safety}  ${tags.join(" · ")}`;
    }),
    `[Safe Route] selected: ${selection.selected.candidateId}`,
    `[Safe Route] why: ${selection.reason}`,
  ];
  return lines.join("\n");
}
