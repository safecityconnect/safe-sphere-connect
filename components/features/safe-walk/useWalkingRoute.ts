"use client";

import { useEffect, useMemo, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import {
  estimateWalkingSeconds,
  formatDistance,
  formatDurationShort,
  haversineDistanceMeters,
  simplifyPath,
} from "@/lib/map/geo";
import type { GeoPoint } from "@/lib/types/safe-walk";

export type WalkingRouteResult = {
  status: "idle" | "loading" | "ready";
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  path: GeoPoint[];
  /** Set when the Directions API failed and figures are a straight-line estimate. */
  isEstimate: boolean;
};

export const IDLE_WALKING_ROUTE: WalkingRouteResult = {
  status: "idle",
  distanceMeters: 0,
  distanceText: "",
  durationSeconds: 0,
  durationText: "",
  path: [],
  isEstimate: false,
};

const LOADING_WALKING_ROUTE: WalkingRouteResult = { ...IDLE_WALKING_ROUTE, status: "loading" };

function estimateFromStraightLine(
  origin: GeoPoint,
  destination: GeoPoint
): WalkingRouteResult {
  const meters = haversineDistanceMeters(origin, destination);
  const seconds = estimateWalkingSeconds(meters);
  return {
    status: "ready",
    distanceMeters: meters,
    distanceText: formatDistance(meters),
    durationSeconds: seconds,
    durationText: formatDurationShort(seconds),
    path: [origin, destination],
    isEstimate: true,
  };
}

function routeKey(origin: GeoPoint | null, destination: GeoPoint | null): string | null {
  if (!origin || !destination) return null;
  return `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`;
}

/**
 * Computes a walking route between two points using the Google Directions
 * API (loaded on demand via the "routes" library), falling back to a
 * straight-line distance estimate if Directions is unavailable or errors
 * out, so Safe Walk always has a usable distance/ETA.
 *
 * The "idle"/"loading" states are derived in render from the current inputs;
 * the effect below only ever calls `setState` from inside the async
 * Directions response, never synchronously in the effect body.
 */
export function useWalkingRoute(
  origin: GeoPoint | null,
  destination: GeoPoint | null
): WalkingRouteResult {
  const routesLibrary = useMapsLibrary("routes");
  const key = routeKey(origin, destination);
  const [resolved, setResolved] = useState<{ key: string; result: WalkingRouteResult } | null>(
    null
  );

  useEffect(() => {
    if (!key || !origin || !destination || !routesLibrary) return;
    let cancelled = false;

    const directionsService = new routesLibrary.DirectionsService();
    directionsService
      .route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
      })
      .then((response) => {
        if (cancelled) return;
        const leg = response.routes[0]?.legs[0];
        const overviewPath = response.routes[0]?.overview_path;
        if (!leg || !overviewPath) {
          setResolved({ key, result: estimateFromStraightLine(origin, destination) });
          return;
        }

        const path = overviewPath.map((p) => ({ lat: p.lat(), lng: p.lng() }));
        const distanceMeters =
          leg.distance?.value ?? haversineDistanceMeters(origin, destination);
        const durationSeconds =
          leg.duration?.value ?? estimateWalkingSeconds(distanceMeters);

        setResolved({
          key,
          result: {
            status: "ready",
            distanceMeters,
            distanceText: leg.distance?.text ?? formatDistance(distanceMeters),
            durationSeconds,
            durationText: leg.duration?.text ?? formatDurationShort(durationSeconds),
            path: simplifyPath(path),
            isEstimate: false,
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResolved({ key, result: estimateFromStraightLine(origin, destination) });
      });

    return () => {
      cancelled = true;
    };
    // `key` already encodes origin/destination numerically; omitting the
    // object references avoids refetching on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, routesLibrary]);

  return useMemo(() => {
    if (!key) return IDLE_WALKING_ROUTE;
    if (resolved?.key === key) return resolved.result;
    return LOADING_WALKING_ROUTE;
  }, [key, resolved]);
}

/**
 * Renderless helper that calls `useWalkingRoute` and reports every result to
 * `onChange`. `useMapsLibrary` only works inside `SafeWalkMapProvider`'s
 * `APIProvider`, so this lets a parent that renders the provider (rather
 * than living inside it) still get live Directions results, the same way
 * `JourneyPlanner` reports back to `SafeWalkContent` via `onRouteChange`.
 */
export function WalkingRouteWatcher({
  origin,
  destination,
  onChange,
}: {
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  onChange: (route: WalkingRouteResult) => void;
}) {
  const route = useWalkingRoute(origin, destination);

  useEffect(() => {
    onChange(route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  return null;
}
