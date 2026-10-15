import { describe, expect, it } from "vitest";
import type { AreaHealthSnapshot, SectorHealth } from "../lib/area-health";
import { riskLevelForScore } from "../lib/area-health";
import {
  evaluateRouteSafety,
  selectSafestReasonableRoute,
  type RouteSafetyCandidate,
} from "../lib/safe-route-recommendation";
import type { GeoPoint } from "../lib/types/safe-walk";

function sector(overrides: Partial<SectorHealth> & Pick<SectorHealth, "sector" | "score">): SectorHealth {
  const score = overrides.score;
  return {
    key: `${(overrides.city ?? "Chandigarh").toLowerCase()}::${overrides.sector.toLowerCase()}`,
    city: "Chandigarh",
    riskLevel: riskLevelForScore(score),
    reportCount: 4,
    activeReportCount: 3,
    incidentCount: 3,
    infrastructureReportCount: 1,
    ...overrides,
  };
}

function snapshot(sectors: SectorHealth[]): AreaHealthSnapshot {
  const overallScore = Math.round(
    sectors.reduce((sum, item) => sum + item.score, 0) / Math.max(1, sectors.length)
  );
  return {
    overallScore,
    riskLevel: riskLevelForScore(overallScore),
    reportCount: sectors.reduce((sum, item) => sum + item.reportCount, 0),
    activeReportCount: sectors.reduce((sum, item) => sum + item.activeReportCount, 0),
    sectors,
    metrics: [],
    updatedAt: new Date("2026-09-09T00:00:00Z"),
  };
}

function candidate(
  id: string,
  path: GeoPoint[],
  distanceMeters: number,
  durationSeconds: number
): RouteSafetyCandidate {
  return {
    id,
    path,
    distanceMeters,
    distanceText: `${(distanceMeters / 1000).toFixed(1)} km`,
    durationSeconds,
    durationText: `${Math.round(durationSeconds / 60)} min`,
    provider: "google-directions",
  };
}

const UNSAFE = sector({
  sector: "Sector 22",
  score: 28,
  latitude: 30.733,
  longitude: 76.78,
});
const SAFE = sector({
  sector: "Sector 17",
  score: 92,
  latitude: 30.741,
  longitude: 76.801,
});
const AREA = snapshot([UNSAFE, SAFE]);

const THROUGH_UNSAFE: GeoPoint[] = [
  { lat: 30.73, lng: 76.77 },
  { lat: 30.733, lng: 76.78 },
  { lat: 30.735, lng: 76.79 },
];
const THROUGH_SAFE: GeoPoint[] = [
  { lat: 30.73, lng: 76.79 },
  { lat: 30.741, lng: 76.801 },
  { lat: 30.735, lng: 76.81 },
];

describe("evaluateRouteSafety", () => {
  it("scores a path through an unsafe sector lower than one through a safer sector", () => {
    const unsafeScore = evaluateRouteSafety(
      candidate("google-0", THROUGH_UNSAFE, 1000, 720),
      AREA
    );
    const safeScore = evaluateRouteSafety(
      candidate("google-1", THROUGH_SAFE, 1100, 800),
      AREA
    );

    expect(safeScore.safetyScore).toBeGreaterThan(unsafeScore.safetyScore + 10);
  });
});

describe("selectSafestReasonableRoute", () => {
  it("selects the safer Google alternative when the detour is modest", () => {
    const selection = selectSafestReasonableRoute(
      [
        candidate("google-0", THROUGH_UNSAFE, 1000, 720),
        candidate("google-1", THROUGH_SAFE, 1120, 800),
      ],
      AREA
    );

    expect(selection?.comparedMultiple).toBe(true);
    expect(selection?.selected.candidateId).toBe("google-1");
    expect(selection?.fastestCandidate.id).toBe("google-0");
    expect(selection?.reason).toMatch(/Selected over the fastest/i);
    expect(selection?.reason).toMatch(/Sector 22/);
  });

  it("does not pick an absurdly long route just because it is slightly safer", () => {
    const selection = selectSafestReasonableRoute(
      [
        candidate("google-0", THROUGH_UNSAFE, 1000, 720),
        candidate("google-1", THROUGH_SAFE, 1600, 1200),
      ],
      AREA
    );

    expect(selection?.selected.candidateId).toBe("google-0");
    expect(selection?.comparisons.find((row) => row.candidateId === "google-1")?.eligible).toBe(
      false
    );
    expect(selection?.reason).toMatch(/extra distance\/time is too large/i);
  });

  it("falls back to the only Google route instead of inventing alternatives", () => {
    const selection = selectSafestReasonableRoute(
      [candidate("google-0", THROUGH_UNSAFE, 1000, 720)],
      AREA
    );

    expect(selection?.comparedMultiple).toBe(false);
    expect(selection?.selected.candidateId).toBe("google-0");
    expect(selection?.reason).toMatch(/one walking route/i);
  });

  it("does not claim a route avoids an unsafe area unless its geometry stays away", () => {
    const bothThroughUnsafe: GeoPoint[] = [
      { lat: 30.732, lng: 76.779 },
      { lat: 30.734, lng: 76.781 },
    ];
    const selection = selectSafestReasonableRoute(
      [
        candidate("google-0", THROUGH_UNSAFE, 1000, 720),
        candidate("google-1", bothThroughUnsafe, 1080, 760),
      ],
      AREA
    );

    expect(selection?.reason).not.toMatch(/stays farther from Sector 22/i);
  });
});
