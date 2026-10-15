import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMMUNITY_CONCERN_CATEGORY_LABELS,
  COMMUNITY_CONCERN_DISPLAY_RADIUS_METERS,
  COMMUNITY_CONCERNS,
  COMMUNITY_SURVEY_SOURCE,
  communityConcernsNearRoute,
  describeMentions,
  hasMappedCommunityConcerns,
  unmappedCommunityConcerns,
  type CommunityConcern,
} from "../lib/community-concerns";
import type { GeoPoint } from "../lib/types/safe-walk";

// Test-only fixtures — not survey data.
const ROUTE: GeoPoint[] = [
  { lat: 30.73, lng: 76.77 },
  { lat: 30.73, lng: 76.79 },
];
const NEAR: CommunityConcern = {
  id: "test-near",
  placeName: "Test underpass",
  city: "Chandigarh",
  categories: ["poor-lighting-isolated"],
  independentMentions: 3,
  location: { lat: 30.7315, lng: 76.78 }, // ~170 m from ROUTE
};
const FAR: CommunityConcern = {
  id: "test-far",
  placeName: "Test market",
  city: "Chandigarh",
  categories: ["crime-related"],
  independentMentions: 2,
  location: { lat: 30.75, lng: 76.78 }, // ~2.2 km from ROUTE
};
const UNMAPPED: CommunityConcern = {
  id: "test-unmapped",
  placeName: "Test bus stop",
  city: "Chandigarh",
  categories: ["no-specific-reason"],
  independentMentions: null,
};

describe("communityConcernsNearRoute", () => {
  it("lists mapped concerns within the display radius and skips farther ones", () => {
    const matches = communityConcernsNearRoute(ROUTE, [NEAR, FAR, UNMAPPED]);

    expect(matches.map((match) => match.concern.id)).toEqual(["test-near"]);
    expect(matches[0].distanceMeters).toBeLessThanOrEqual(COMMUNITY_CONCERN_DISPLAY_RADIUS_METERS);
  });

  it("uses the configurable radius only for display matching", () => {
    expect(COMMUNITY_CONCERN_DISPLAY_RADIUS_METERS).toBe(300);
    expect(communityConcernsNearRoute(ROUTE, [NEAR], 100)).toEqual([]);
    expect(communityConcernsNearRoute(ROUTE, [FAR], 2_500).map((m) => m.concern.id)).toEqual([
      "test-far",
    ]);
  });

  it("never matches concerns without confirmed coordinates and reports them as unmapped", () => {
    expect(communityConcernsNearRoute(ROUTE, [UNMAPPED], 1_000_000)).toEqual([]);
    expect(unmappedCommunityConcerns([NEAR, UNMAPPED]).map((c) => c.id)).toEqual([
      "test-unmapped",
    ]);
    expect(hasMappedCommunityConcerns([UNMAPPED])).toBe(false);
  });
});

describe("describeMentions", () => {
  it("states independent corroboration only from the recorded count", () => {
    expect(describeMentions(NEAR)).toBe("Named independently by 3 teachers");
    expect(describeMentions({ ...NEAR, independentMentions: 1 })).toBe("Named by 1 teacher");
  });

  it("leaves unknown or invalid counts unconfirmed instead of inventing a number", () => {
    for (const value of [null, 0, -1, 1.5, Number.NaN]) {
      expect(describeMentions({ ...NEAR, independentMentions: value })).toBe(
        "Number of teachers not yet confirmed"
      );
    }
  });

  it("never describes a concern with safety or score language", () => {
    for (const concern of [NEAR, FAR, UNMAPPED]) {
      expect(describeMentions(concern)).not.toMatch(/safe|risk|\/100|score/i);
    }
  });
});

describe("survey source and data", () => {
  it("describes the method factually without an invented date", () => {
    expect(COMMUNITY_SURVEY_SOURCE.method).toMatch(/asked independently where they felt unsafe/i);
    expect(COMMUNITY_SURVEY_SOURCE.method).toMatch(/No compiled list/i);
    expect(COMMUNITY_SURVEY_SOURCE.limitations).toMatch(/not used in the safety score/i);
    expect(COMMUNITY_SURVEY_SOURCE.limitations).toMatch(/may still be unsafe/i);
    expect(COMMUNITY_SURVEY_SOURCE.conductedOn).toBeNull();
  });

  it("has unique places, each with at least one known category", () => {
    const places = new Set<string>();
    for (const concern of COMMUNITY_CONCERNS) {
      const key = `${concern.city}::${concern.placeName}`.toLowerCase();
      expect(places.has(key)).toBe(false);
      places.add(key);
      expect(concern.categories.length).toBeGreaterThan(0);
      expect(new Set(concern.categories).size).toBe(concern.categories.length);
      for (const category of concern.categories) {
        expect(COMMUNITY_CONCERN_CATEGORY_LABELS[category]).toBeDefined();
      }
    }
  });

  it("uses category labels without safety or score language", () => {
    for (const label of Object.values(COMMUNITY_CONCERN_CATEGORY_LABELS)) {
      expect(label).not.toMatch(/safe|risk|\/100|score/i);
    }
  });

  it("only contains substantiated counts and valid coordinates", () => {
    const ids = new Set<string>();
    for (const concern of COMMUNITY_CONCERNS) {
      expect(ids.has(concern.id)).toBe(false);
      ids.add(concern.id);
      const count = concern.independentMentions;
      expect(count === null || (Number.isInteger(count) && count >= 1)).toBe(true);
      if (concern.location) {
        expect(Math.abs(concern.location.lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(concern.location.lng)).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe("separation from route scoring", () => {
  it("is not imported by the route scoring and ranking module", () => {
    const scoring = readFileSync(resolve("lib/safe-route-recommendation.ts"), "utf8");
    expect(scoring).not.toMatch(/community-concerns/);
  });
});
