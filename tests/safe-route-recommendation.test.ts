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

// ── Score basis, nearby sectors and evidence ───────────────────────────────

/** About 7 km from both fixture sectors — outside the 2.5 km scoring radius. */
const FAR_AWAY: GeoPoint[] = [
  { lat: 30.69, lng: 76.85 },
  { lat: 30.692, lng: 76.86 },
];

describe("score basis and evidence", () => {
  it("marks a route with no nearby sectors as a citywide fallback, not as safe", () => {
    const result = evaluateRouteSafety(candidate("google-0", FAR_AWAY, 1000, 720), AREA);

    expect(result.scoreBasis).toBe("citywide-fallback");
    expect(result.hasSafetyData).toBe(false);
    expect(result.nearbySectors).toEqual([]);
    expect(result.evidence).toMatch(/safety is unknown/i);
    expect(result.evidence).toMatch(/does not mean the area is safe/i);
    expect(result.evidence).not.toMatch(/low.?risk/i);
    expect(result.explanation).not.toMatch(/low.?risk/i);
  });

  it("lists the nearby sectors and their reports for a route with verified data", () => {
    const result = evaluateRouteSafety(candidate("google-1", THROUGH_SAFE, 1100, 800), AREA);

    expect(result.scoreBasis).toBe("nearby-reports");
    expect(result.hasSafetyData).toBe(true);
    expect(result.nearbySectors[0]).toMatchObject({
      sector: "Sector 17",
      city: "Chandigarh",
      score: 92,
      distanceMeters: 0,
      incidentCount: 3,
      infrastructureReportCount: 1,
    });
    expect(result.evidence).toMatch(
      /Sector 17, Chandigarh: 92\/100 \(3 incidents and 1 civic report, 0\.0 km from route\)/
    );
  });

  it("distinguishes having no reports at all from having none nearby", () => {
    const result = evaluateRouteSafety(
      candidate("google-0", THROUGH_SAFE, 1000, 720),
      snapshot([])
    );

    expect(result.scoreBasis).toBe("no-reports");
    expect(result.hasSafetyData).toBe(false);
    expect(result.evidence).toMatch(/No verified reports are available yet/);
  });

  it("lists at most three nearby sectors, nearest first", () => {
    const sectors = [0.004, 0.001, 0.008, 0.002, 0.006].map((offset, index) =>
      sector({
        sector: `Sector ${30 + index}`,
        score: 70 + index,
        latitude: 30.73 + offset,
        longitude: 76.78,
      })
    );
    const result = evaluateRouteSafety(
      candidate("google-0", [
        { lat: 30.73, lng: 76.77 },
        { lat: 30.73, lng: 76.79 },
      ], 1000, 720),
      snapshot(sectors)
    );

    expect(result.nearbySectors.map((item) => item.sector)).toEqual([
      "Sector 31",
      "Sector 33",
      "Sector 30",
    ]);
    const distances = result.nearbySectors.map((item) => item.distanceMeters ?? 0);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("labels a sector matched only by the destination address", () => {
    const result = evaluateRouteSafety(
      {
        ...candidate("google-0", FAR_AWAY, 1000, 720),
        sectorHints: ["Plaza, Sector 17, Chandigarh"],
      },
      AREA
    );

    expect(result.scoreBasis).toBe("nearby-reports");
    expect(result.nearbySectors[0].distanceMeters).toBeNull();
    expect(result.evidence).toMatch(/matched by destination address/);
  });
});

describe("selection reasons with and without nearby reports", () => {
  it("keeps today's choice for mixed routes but never cites the fallback as a safety score", () => {
    // Current ranking: the far route is ranked with the citywide average (60),
    // which beats the fastest route through Sector 22 (score 39).
    const selection = selectSafestReasonableRoute(
      [
        candidate("google-0", THROUGH_UNSAFE, 1000, 720),
        candidate("google-1", FAR_AWAY, 1100, 790),
      ],
      AREA
    );

    expect(selection?.selected.candidateId).toBe("google-1");
    expect(selection?.selected.scoreBasis).toBe("citywide-fallback");
    expect(
      selection?.comparisons.find((row) => row.candidateId === "google-1")?.scoreBasis
    ).toBe("citywide-fallback");
    expect(selection?.reason).toMatch(/passes near Sector 22 \(28\/100\)/);
    expect(selection?.reason).toMatch(/safety is unknown/i);
    expect(selection?.reason).not.toMatch(/60\/100/);
  });

  it("explains when every alternative lacks nearby reports", () => {
    const selection = selectSafestReasonableRoute(
      [
        candidate("google-0", FAR_AWAY, 1000, 720),
        candidate("google-1", FAR_AWAY, 1050, 760),
      ],
      AREA
    );

    expect(selection?.selected.candidateId).toBe("google-0");
    expect(selection?.reason).toMatch(/None pass near verified reports/);
    expect(selection?.reason).not.toMatch(/no verified Area Health reports are available yet/i);
    expect(selection?.reason).not.toMatch(/similar/i);
  });

  it("does not call safety similar when the fastest route's alternatives are unknown", () => {
    const selection = selectSafestReasonableRoute(
      [
        candidate("google-0", THROUGH_SAFE, 1000, 720),
        candidate("google-1", FAR_AWAY, 1100, 790),
      ],
      AREA
    );

    expect(selection?.selected.candidateId).toBe("google-0");
    expect(selection?.reason).toMatch(/1 of the alternatives has no verified reports nearby/);
    expect(selection?.reason).not.toMatch(/similar/i);
  });

  it("does not describe an unknown route as a safer option that was too long", () => {
    const selection = selectSafestReasonableRoute(
      [
        candidate("google-0", THROUGH_UNSAFE, 1000, 720),
        candidate("google-1", FAR_AWAY, 1600, 1200),
      ],
      AREA
    );

    expect(selection?.selected.candidateId).toBe("google-0");
    expect(selection?.reason).not.toMatch(/safer option/i);
  });

  it("says a single route without nearby reports has unknown safety", () => {
    const selection = selectSafestReasonableRoute(
      [candidate("google-0", FAR_AWAY, 1000, 720)],
      AREA
    );

    expect(selection?.reason).toMatch(/one walking route/i);
    expect(selection?.reason).toMatch(/safety is unknown/i);
  });

  it("keeps the no-reports message when there is no verified data anywhere", () => {
    const selection = selectSafestReasonableRoute(
      [
        candidate("google-0", THROUGH_SAFE, 1000, 720),
        candidate("google-1", THROUGH_UNSAFE, 1050, 760),
      ],
      snapshot([])
    );

    expect(selection?.selected.scoreBasis).toBe("no-reports");
    expect(selection?.reason).toMatch(/no verified Area Health reports are available yet/i);
  });
});
