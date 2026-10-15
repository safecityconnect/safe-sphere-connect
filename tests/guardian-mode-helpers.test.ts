import { describe, expect, it } from "vitest";
import {
  GUARDIAN_MIN_WRITE_INTERVAL_MS,
  formatLocationAge,
  isGuardianModeSession,
  shouldWriteGuardianLocation,
} from "../lib/guardian-mode-helpers";

describe("isGuardianModeSession", () => {
  it("separates Guardian Mode sessions from Safe Walks, including older walks", () => {
    expect(isGuardianModeSession({ sessionType: "guardian-mode" })).toBe(true);
    expect(isGuardianModeSession({ sessionType: "safe-walk" })).toBe(false);
    expect(isGuardianModeSession({})).toBe(false);
  });
});

describe("shouldWriteGuardianLocation", () => {
  const start = { lat: 30.7333, lng: 76.7794 };

  it("always writes the first location", () => {
    expect(shouldWriteGuardianLocation(null, start, 0)).toBe(true);
  });

  it("skips tiny moves within the write interval", () => {
    const last = { location: start, time: 1_000 };
    expect(shouldWriteGuardianLocation(last, { lat: 30.73331, lng: 76.7794 }, 2_000)).toBe(false);
  });

  it("writes after moving far enough", () => {
    const last = { location: start, time: 1_000 };
    expect(shouldWriteGuardianLocation(last, { lat: 30.7335, lng: 76.7794 }, 2_000)).toBe(true);
  });

  it("writes after the interval even without moving", () => {
    const last = { location: start, time: 1_000 };
    expect(shouldWriteGuardianLocation(last, start, 1_000 + GUARDIAN_MIN_WRITE_INTERVAL_MS)).toBe(true);
  });
});

describe("formatLocationAge", () => {
  const now = 1_000_000;

  it("describes how old the last shared location is", () => {
    expect(formatLocationAge(null, now)).toBe("waiting for first update");
    expect(formatLocationAge(new Date(now - 3_000), now)).toBe("just now");
    expect(formatLocationAge(new Date(now - 42_000), now)).toBe("42s ago");
    expect(formatLocationAge(new Date(now - 5 * 60_000), now)).toBe("5m ago");
    expect(formatLocationAge(new Date(now - 2 * 3_600_000), now)).toBe("2h ago");
  });
});
