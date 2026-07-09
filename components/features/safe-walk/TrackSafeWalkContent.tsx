"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { FirestoreError } from "firebase/firestore";
import { AlertTriangle, Navigation, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/firebase";
import { ROUTES } from "@/lib/constants";
import {
  clampPercent,
  estimateWalkingSeconds,
  formatDistance,
  formatDurationShort,
  haversineDistanceMeters,
} from "@/lib/map/geo";
import { subscribeToSafeWalk } from "@/lib/safe-walk";
import type { SafeWalkDoc } from "@/lib/types/safe-walk";
import { SafeWalkMapProvider } from "./SafeWalkMapProvider";
import { SafeWalkMapView } from "./SafeWalkMapView";
import { useSmoothedMeters } from "./useSmoothedMeters";
import {
  IDLE_WALKING_ROUTE,
  WalkingRouteWatcher,
  type WalkingRouteResult,
} from "./useWalkingRoute";

type TrackSafeWalkContentProps = {
  walkId: string;
};

type ViewState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "not-found" }
  | { kind: "forbidden"; message: string }
  | { kind: "ready"; walk: SafeWalkDoc };

/** Friendly copy for the Firestore error codes this subscription can hit. */
function messageForSnapshotError(error: FirestoreError): string {
  if (error.code === "permission-denied") {
    return "You don't have permission to view this journey.";
  }
  return "Something went wrong loading this journey. Please try again.";
}

function formatUpdatedAgo(timestamp: SafeWalkDoc["locationUpdatedAt"]): string {
  const date = timestamp?.toDate?.();
  if (!date) return "just now";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export function TrackSafeWalkContent({ walkId }: TrackSafeWalkContentProps) {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [walk, setWalk] = useState<SafeWalkDoc | null | undefined>(undefined);
  const [snapshotError, setSnapshotError] = useState<FirestoreError | null>(null);
  const [remainingRoute, setRemainingRoute] = useState<WalkingRouteResult>(IDLE_WALKING_ROUTE);
  // Tracks which walk `snapshotError`/`remainingRoute` belong to, so they
  // reset synchronously during render when `walkId` changes (React's
  // recommended pattern for adjusting state on a prop change).
  const [trackedWalkId, setTrackedWalkId] = useState(walkId);

  if (trackedWalkId !== walkId) {
    setTrackedWalkId(walkId);
    setSnapshotError(null);
    setRemainingRoute(IDLE_WALKING_ROUTE);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToSafeWalk(walkId, setWalk, (error) => {
      setSnapshotError(error);
    });
    return () => unsub();
  }, [walkId]);

  // Raw, GPS-derived remaining distance from the walker's last known
  // position; smoothed below so it doesn't flicker on small drift, and
  // superseded by the Directions API's remaining distance/duration
  // whenever that has resolved (see `WalkingRouteWatcher` below).
  const rawRemainingMeters = useMemo(() => {
    if (!walk) return null;
    return haversineDistanceMeters(walk.currentLocation, walk.destination);
  }, [walk]);

  const usingDirectionsForRemaining =
    remainingRoute.status === "ready" && !remainingRoute.isEstimate;
  const bestRawRemainingMeters = usingDirectionsForRemaining
    ? remainingRoute.distanceMeters
    : rawRemainingMeters;

  const smoothedRemainingMeters = useSmoothedMeters(bestRawRemainingMeters, walkId);

  const state: ViewState = useMemo(() => {
    if (snapshotError) {
      return { kind: "forbidden", message: messageForSnapshotError(snapshotError) };
    }
    if (uid === undefined || walk === undefined) return { kind: "loading" };
    if (uid === null) return { kind: "signed-out" };
    if (walk === null) return { kind: "not-found" };
    if (walk.walkerId !== uid && !walk.guardianIds.includes(uid)) {
      return {
        kind: "forbidden",
        message: "You don't have permission to view this journey.",
      };
    }
    return { kind: "ready", walk };
  }, [uid, walk, snapshotError]);

  if (state.kind === "loading") {
    return (
      <PageContainer withBottomNav>
        <PageHeader title="Live Journey" subtitle="Loading…" backHref={ROUTES.safeWalk} />
        <Skeleton className="mb-4 h-56 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </PageContainer>
    );
  }

  if (state.kind === "signed-out" || state.kind === "forbidden") {
    const message =
      state.kind === "forbidden"
        ? state.message
        : "You don't have access to view this journey.";
    return (
      <PageContainer withBottomNav>
        <PageHeader title="Live Journey" backHref={ROUTES.safeWalk} />
        <Card padding="md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-foreground">{message}</p>
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (state.kind === "not-found") {
    return (
      <PageContainer withBottomNav>
        <PageHeader title="Live Journey" backHref={ROUTES.safeWalk} />
        <Card padding="md">
          <p className="text-sm text-muted">This journey could not be found.</p>
        </Card>
      </PageContainer>
    );
  }

  const activeWalk = state.walk;
  const isActive = activeWalk.status === "active";

  const remainingDistanceMeters = smoothedRemainingMeters ?? bestRawRemainingMeters ?? 0;
  const remainingDurationSeconds = usingDirectionsForRemaining
    ? remainingRoute.durationSeconds
    : estimateWalkingSeconds(remainingDistanceMeters);
  const remainingDurationText = usingDirectionsForRemaining
    ? remainingRoute.durationText
    : formatDurationShort(remainingDurationSeconds);

  const progressFraction =
    activeWalk.distanceMeters > 0
      ? clampPercent(
          ((activeWalk.distanceMeters - remainingDistanceMeters) / activeWalk.distanceMeters) * 100
        )
      : activeWalk.progressPercent;

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title={`${activeWalk.walkerName}'s Journey`}
        subtitle={isActive ? "Live tracking" : "Journey ended"}
        backHref={ROUTES.safeWalk}
      />

      <Card padding="none" className="mb-6 overflow-hidden">
        <SafeWalkMapProvider>
          <SafeWalkMapView
            origin={activeWalk.origin}
            destination={activeWalk.destination}
            current={activeWalk.currentLocation}
            path={activeWalk.routePath}
          />
          <WalkingRouteWatcher
            origin={isActive ? activeWalk.currentLocation : null}
            destination={isActive ? activeWalk.destination : null}
            onChange={setRemainingRoute}
          />
        </SafeWalkMapProvider>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge
              variant={isActive ? "success" : activeWalk.status === "cancelled" ? "danger" : "info"}
            >
              {isActive ? "Active" : activeWalk.status === "cancelled" ? "Cancelled" : "Completed"}
            </Badge>
            {isActive && (
              <span className="text-xs text-muted">
                Updated {formatUpdatedAgo(activeWalk.locationUpdatedAt)}
              </span>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs text-muted">Destination</p>
              <p className="text-sm font-medium text-foreground">
                {activeWalk.destination.address}
              </p>
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                isActive ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${Math.round(progressFraction)}%` }}
            />
          </div>
          {isActive && (
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{formatDistance(remainingDistanceMeters)} remaining</span>
              <span>ETA {remainingDurationText}</span>
            </div>
          )}
        </div>
      </Card>

      {!isActive && (
        <Card padding="sm" className="bg-primary-light/30">
          <p className="text-sm text-foreground">
            <ShieldCheck className="mr-1 inline h-4 w-4 text-primary" />
            {activeWalk.endReason === "arrived"
              ? `${activeWalk.walkerName} arrived safely at their destination.`
              : activeWalk.endReason === "cancelled"
                ? "This journey was cancelled before it began covering much ground."
                : "This journey was ended by the walker before arrival."}
          </p>
        </Card>
      )}
    </PageContainer>
  );
}
