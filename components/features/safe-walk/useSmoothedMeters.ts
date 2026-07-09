"use client";

import { useState } from "react";

/** Changes smaller than this (typical GPS drift while stationary) are ignored. */
const DEFAULT_DEADBAND_METERS = 6;
/** How much of a larger, real change to apply per update (0-1). */
const DEFAULT_SMOOTHING_FACTOR = 0.35;

type SmoothedMetersOptions = {
  deadbandMeters?: number;
  smoothingFactor?: number;
};

type TrackedState = {
  resetKey: string | null;
  rawMeters: number | null;
  smoothed: number | null;
};

/**
 * Smooths a frequently-updating, GPS-derived distance (e.g. "remaining
 * distance to destination") so small drift while the walker is stationary
 * doesn't make the on-screen number rapidly jump up and down.
 *
 * - Changes smaller than `deadbandMeters` are treated as noise and ignored.
 * - Larger, real changes are blended in gradually instead of snapping.
 * - Passing a new `resetKey` (e.g. a new walk's id) snaps immediately to the
 *   next value instead of blending, so a new journey doesn't slowly "catch
 *   up" from the previous one's distance.
 *
 * Recomputes synchronously during render (rather than in an effect) when
 * `rawMeters`/`resetKey` change, following React's guidance for adjusting
 * state derived from props: https://react.dev/learn/you-might-not-need-an-effect
 */
export function useSmoothedMeters(
  rawMeters: number | null,
  resetKey: string | null,
  { deadbandMeters = DEFAULT_DEADBAND_METERS, smoothingFactor = DEFAULT_SMOOTHING_FACTOR }: SmoothedMetersOptions = {}
): number | null {
  const [tracked, setTracked] = useState<TrackedState>({
    resetKey,
    rawMeters,
    smoothed: rawMeters,
  });

  const isNewWalk = tracked.resetKey !== resetKey;
  const rawChanged = isNewWalk || tracked.rawMeters !== rawMeters;

  if (rawChanged) {
    let nextSmoothed: number | null;
    if (rawMeters === null) {
      nextSmoothed = null;
    } else if (isNewWalk || tracked.smoothed === null) {
      nextSmoothed = rawMeters;
    } else {
      const delta = rawMeters - tracked.smoothed;
      nextSmoothed =
        Math.abs(delta) < deadbandMeters ? tracked.smoothed : tracked.smoothed + delta * smoothingFactor;
    }
    setTracked({ resetKey, rawMeters, smoothed: nextSmoothed });
    return nextSmoothed;
  }

  return tracked.smoothed;
}
