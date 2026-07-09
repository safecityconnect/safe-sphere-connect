"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  AlertTriangle,
  Phone,
  Shield,
  Square,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLocale } from "@/components/providers/LocaleProvider";
import { auth } from "@/lib/firebase";
import { getUserName } from "@/lib/family";
import { ROUTES, safeWalkTrackRoute } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";
import {
  clampPercent,
  estimateWalkingSeconds,
  formatDistance,
  formatDurationShort,
  haversineDistanceMeters,
} from "@/lib/map/geo";
import {
  createSafeWalk,
  finishSafeWalk,
  getActiveSafeWalkForUser,
  getSafeWalkGuardians,
  incrementUserSafeWalkCount,
  subscribeToGuardianActiveWalks,
  subscribeToSafeWalk,
  updateSafeWalkLocation,
} from "@/lib/safe-walk";
import type {
  GeoPoint,
  SafeWalkDestination,
  SafeWalkDoc,
  SafeWalkEndReason,
  SafeWalkGuardian,
  SafeWalkStatus,
} from "@/lib/types/safe-walk";
import { JourneyPlanner } from "./JourneyPlanner";
import { SafeWalkMapProvider } from "./SafeWalkMapProvider";
import { SafeWalkMapView } from "./SafeWalkMapView";
import { useSmoothedMeters } from "./useSmoothedMeters";
import {
  IDLE_WALKING_ROUTE,
  WalkingRouteWatcher,
  type WalkingRouteResult,
} from "./useWalkingRoute";

/** How close (in meters) the walker needs to be to auto-complete the journey. */
const ARRIVAL_RADIUS_METERS = 40;
/** Location writes to Firestore are throttled to save quota/battery. */
const MIN_WRITE_DISTANCE_METERS = 8;
const MIN_WRITE_INTERVAL_MS = 8_000;

function notificationTitleFor(reason: SafeWalkEndReason, walkerName: string): string {
  if (reason === "arrived") return `${walkerName} arrived safely`;
  if (reason === "cancelled") return `${walkerName} cancelled a Safe Walk`;
  return `${walkerName} ended their Safe Walk`;
}

function notificationMessageFor(reason: SafeWalkEndReason, address: string): string {
  if (reason === "arrived") return `Reached ${address}. Safe Walk complete.`;
  if (reason === "cancelled") return `The walk to ${address} was cancelled.`;
  return `The walk to ${address} was ended before arrival.`;
}

function outcomeMessageFor(reason: SafeWalkEndReason, address: string): string {
  if (reason === "arrived") return `You arrived safely at ${address}. Great walk!`;
  if (reason === "cancelled") return `Walk to ${address} was cancelled.`;
  return "Walk ended. Stay safe!";
}

export function SafeWalkContent() {
  const { t } = useLocale();

  const [authChecked, setAuthChecked] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  const [guardians, setGuardians] = useState<SafeWalkGuardian[]>([]);
  const [guardiansLoaded, setGuardiansLoaded] = useState(false);

  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [originStatus, setOriginStatus] = useState<"requesting" | "captured" | "unavailable">(
    () => (typeof navigator !== "undefined" && !navigator.geolocation ? "unavailable" : "requesting")
  );

  const [destination, setDestination] = useState<SafeWalkDestination | null>(null);
  const [route, setRoute] = useState<WalkingRouteResult>(IDLE_WALKING_ROUTE);

  const [checkingActiveWalk, setCheckingActiveWalk] = useState(true);
  const [activeWalk, setActiveWalk] = useState<SafeWalkDoc | null>(null);
  const [liveLocation, setLiveLocation] = useState<GeoPoint | null>(null);

  // ── Remaining-route (Directions API), used for the progress display ────
  const [remainingRouteOrigin, setRemainingRouteOrigin] = useState<GeoPoint | null>(null);
  const [remainingRoute, setRemainingRoute] = useState<WalkingRouteResult>(IDLE_WALKING_ROUTE);
  // Tracks which walk the two values above belong to, so they can be reset
  // synchronously during render when a new walk starts (see React's guidance
  // on adjusting state when a prop changes, rather than doing it in an effect).
  const [trackedWalkId, setTrackedWalkId] = useState<string | null>(null);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [ending, setEnding] = useState<"end" | "cancel" | null>(null);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);

  const [guardianWalks, setGuardianWalks] = useState<SafeWalkDoc[]>([]);

  const lastWriteRef = useRef<{ loc: GeoPoint; time: number } | null>(null);

  // ── Auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true);
      setUid(user?.uid ?? null);
      if (user) {
        getUserName(user.uid).then(setUserName);
      }
    });
    return () => unsub();
  }, []);

  // ── GPS origin (auto-used as the journey start) ─────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(loc);
        setLiveLocation((prev) => prev ?? loc);
        setOriginStatus("captured");
      },
      () => setOriginStatus("unavailable"),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 30_000 }
    );
  }, []);

  const retryOrigin = () => {
    setOriginStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(loc);
        setLiveLocation((prev) => prev ?? loc);
        setOriginStatus("captured");
      },
      () => setOriginStatus("unavailable"),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 30_000 }
    );
  };

  // ── Guardians, resume-in-progress walk, and walks this user can track ──
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    getSafeWalkGuardians(uid).then((g) => {
      if (!cancelled) {
        setGuardians(g);
        setGuardiansLoaded(true);
      }
    });

    getActiveSafeWalkForUser(uid).then((walk) => {
      if (cancelled) return;
      setCheckingActiveWalk(false);
      if (walk) setActiveWalk(walk);
    });

    const unsubGuardianWalks = subscribeToGuardianActiveWalks(uid, setGuardianWalks);
    return () => {
      cancelled = true;
      unsubGuardianWalks();
    };
  }, [uid]);

  // ── Reset the remaining-route tracker whenever the active walk changes ──
  if (trackedWalkId !== (activeWalk?.id ?? null)) {
    setTrackedWalkId(activeWalk?.id ?? null);
    setRemainingRouteOrigin(null);
    setRemainingRoute(IDLE_WALKING_ROUTE);
  }

  // ── Keep the active walk in sync with Firestore ─────────────────────────
  useEffect(() => {
    const id = activeWalk?.id;
    if (!id) return;

    const unsub = subscribeToSafeWalk(id, (walk) => {
      if (!walk || walk.status !== "active") {
        lastWriteRef.current = null;
        setActiveWalk(null);
        return;
      }
      setActiveWalk(walk);
    });
    return () => unsub();
  }, [activeWalk?.id]);

  const finishWalk = useCallback(
    async (walk: SafeWalkDoc, reason: SafeWalkEndReason) => {
      const status: SafeWalkStatus = reason === "cancelled" ? "cancelled" : "completed";
      try {
        await finishSafeWalk(walk.id, status, reason);
        await Promise.all(
          walk.guardianIds.map((guardianId) =>
            createNotification({
              userId: guardianId,
              title: notificationTitleFor(reason, walk.walkerName),
              message: notificationMessageFor(reason, walk.destination.address),
              type: "safe-walk",
              actionUrl: safeWalkTrackRoute(walk.id),
            }).catch(() => {})
          )
        );
        if (status === "completed") {
          incrementUserSafeWalkCount(walk.walkerId).catch(() => {});
        }
      } finally {
        lastWriteRef.current = null;
        setActiveWalk(null);
        setDestination(null);
        setRoute(IDLE_WALKING_ROUTE);
        setOutcomeMessage(outcomeMessageFor(reason, walk.destination.address));
      }
    },
    []
  );

  // ── Live GPS tracking while a walk is active ────────────────────────────
  useEffect(() => {
    if (!activeWalk || !navigator.geolocation) return;

    const destinationPoint = activeWalk.destination;
    const totalDistance = activeWalk.distanceMeters;
    const walk = activeWalk;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLiveLocation(loc);

        const remaining = haversineDistanceMeters(loc, destinationPoint);

        if (remaining <= ARRIVAL_RADIUS_METERS) {
          finishWalk(walk, "arrived");
          return;
        }

        const progress =
          totalDistance > 0
            ? clampPercent(((totalDistance - remaining) / totalDistance) * 100)
            : 0;

        const now = Date.now();
        const last = lastWriteRef.current;
        const movedEnough =
          !last || haversineDistanceMeters(last.loc, loc) >= MIN_WRITE_DISTANCE_METERS;
        const timeEnough = !last || now - last.time >= MIN_WRITE_INTERVAL_MS;

        if (movedEnough || timeEnough) {
          lastWriteRef.current = { loc, time: now };
          updateSafeWalkLocation(walk.id, loc, progress).catch(() => {});
          // Also refreshes the Directions-based remaining distance/ETA, at
          // the same throttled cadence as the Firestore location write.
          setRemainingRouteOrigin(loc);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWalk?.id, activeWalk?.destination.lat, activeWalk?.destination.lng, activeWalk?.distanceMeters]);

  const handleStartJourney = async () => {
    if (!uid || !origin || !destination || route.status !== "ready") return;
    setStarting(true);
    setStartError(null);
    try {
      const guardianIds = guardians.map((g) => g.uid);
      const walkerName = userName || "A SafeSphere user";

      const walkId = await createSafeWalk({
        walkerId: uid,
        walkerName,
        origin,
        destination,
        routePath: route.path,
        distanceMeters: route.distanceMeters,
        distanceText: route.distanceText,
        durationSeconds: route.durationSeconds,
        durationText: route.durationText,
        guardianIds,
      });

      await Promise.all(
        guardianIds.map((guardianId) =>
          createNotification({
            userId: guardianId,
            title: `${walkerName} started a Safe Walk`,
            message: `Heading to ${destination.address} · ETA ${route.durationText}`,
            type: "safe-walk",
            actionUrl: safeWalkTrackRoute(walkId),
          }).catch(() => {})
        )
      );

      setOutcomeMessage(null);
      setActiveWalk({
        id: walkId,
        walkerId: uid,
        walkerName,
        status: "active",
        origin,
        destination,
        routePath: route.path,
        distanceMeters: route.distanceMeters,
        distanceText: route.distanceText,
        durationSeconds: route.durationSeconds,
        durationText: route.durationText,
        currentLocation: origin,
        locationUpdatedAt: null,
        progressPercent: 0,
        guardianIds,
        startedAt: null,
        endedAt: null,
        endReason: null,
        createdAt: null,
      });
    } catch {
      setStartError("Couldn't start your Safe Walk. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleEndJourney = async () => {
    if (!activeWalk) return;
    setEnding("end");
    await finishWalk(activeWalk, "ended_by_walker");
    setEnding(null);
  };

  const handleCancelJourney = async () => {
    if (!activeWalk) return;
    setEnding("cancel");
    await finishWalk(activeWalk, "cancelled");
    setEnding(null);
  };

  const rawRemainingMeters = useMemo(() => {
    if (!activeWalk) return null;
    return haversineDistanceMeters(liveLocation ?? activeWalk.currentLocation, activeWalk.destination);
  }, [activeWalk, liveLocation]);

  // Prefer the Directions API's remaining distance/duration whenever it has
  // resolved for the walker's current position; otherwise fall back to the
  // straight-line estimate, per the existing fallback approach.
  const usingDirectionsForRemaining =
    remainingRoute.status === "ready" && !remainingRoute.isEstimate;
  const bestRawRemainingMeters = usingDirectionsForRemaining
    ? remainingRoute.distanceMeters
    : rawRemainingMeters;

  // Smooths out GPS drift so "remaining distance" doesn't flicker while
  // the walker is stationary.
  const smoothedRemainingMeters = useSmoothedMeters(
    bestRawRemainingMeters,
    activeWalk?.id ?? null
  );

  const remainingDistanceMeters = smoothedRemainingMeters ?? bestRawRemainingMeters ?? 0;
  const remainingDurationSeconds = usingDirectionsForRemaining
    ? remainingRoute.durationSeconds
    : estimateWalkingSeconds(remainingDistanceMeters);
  const remainingDurationText = usingDirectionsForRemaining
    ? remainingRoute.durationText
    : formatDurationShort(remainingDurationSeconds);

  const progressFraction =
    activeWalk && activeWalk.distanceMeters > 0
      ? clampPercent(
          ((activeWalk.distanceMeters - remainingDistanceMeters) / activeWalk.distanceMeters) * 100
        )
      : activeWalk?.progressPercent ?? 0;

  const isLoading = !authChecked || (!!uid && checkingActiveWalk);

  if (isLoading) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title={t.safeWalk} subtitle={t.loading} backHref={ROUTES.dashboard} />
        <Skeleton className="mb-6 h-40 rounded-2xl" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomNav>
      <PageHeader title={t.safeWalk} subtitle={t.safeWalkSubtitle} backHref={ROUTES.dashboard} />

      <Card
        padding="sm"
        className="mb-6 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t.womenSafety}</p>
              <p className="text-xs text-muted">{t.womenHelpline}</p>
            </div>
          </div>
          <Button variant="danger" size="sm" href="tel:1091">
            <Phone className="h-4 w-4" />
            {t.call1091}
          </Button>
        </div>
      </Card>

      {outcomeMessage && (
        <Card padding="sm" className="mb-6 border-emerald-200 bg-emerald-50">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-emerald-800">{outcomeMessage}</p>
            <button
              type="button"
              onClick={() => setOutcomeMessage(null)}
              aria-label="Dismiss"
              className="shrink-0 text-emerald-600 hover:text-emerald-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      <SafeWalkMapProvider>
        {activeWalk && (
          <WalkingRouteWatcher
            origin={remainingRouteOrigin ?? activeWalk.currentLocation}
            destination={activeWalk.destination}
            onChange={setRemainingRoute}
          />
        )}
        {activeWalk ? (
          <Card className="mb-6 overflow-hidden" padding="none">
            <SafeWalkMapView
              origin={activeWalk.origin}
              destination={activeWalk.destination}
              current={liveLocation ?? activeWalk.currentLocation}
              path={activeWalk.routePath}
            />
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="success">{t.walkInProgress}</Badge>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Users className="h-3.5 w-3.5" />
                  {activeWalk.guardianIds.length > 0
                    ? `${activeWalk.guardianIds.length} watching`
                    : "No guardian tracking"}
                </span>
              </div>

              <p className="text-xs text-muted">{t.headingTo}</p>
              <p className="font-semibold text-foreground">{activeWalk.destination.address}</p>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round(progressFraction)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{formatDistance(remainingDistanceMeters)} remaining</span>
                <span>ETA {remainingDurationText}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleEndJourney}
                  disabled={ending !== null}
                >
                  <Square className="h-4 w-4" />
                  {ending === "end" ? "Ending…" : "End Journey"}
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleCancelJourney}
                  disabled={ending !== null}
                >
                  <X className="h-4 w-4" />
                  {ending === "cancel" ? "Cancelling…" : "Cancel"}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Where are you headed?
            </h2>

            {originStatus === "requesting" && (
              <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Getting your current location…
              </p>
            )}
            {originStatus === "unavailable" && (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-700">
                  We couldn&apos;t access your location. It&apos;s needed as your journey&apos;s starting point.
                </p>
                <button
                  type="button"
                  onClick={retryOrigin}
                  className="shrink-0 text-xs font-semibold text-amber-800 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            <JourneyPlanner
              origin={origin}
              destination={destination}
              onDestinationChange={setDestination}
              onRouteChange={setRoute}
            />

            {destination && (
              <>
                {startError && (
                  <p className="mt-3 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
                    {startError}
                  </p>
                )}
                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  className="mt-4"
                  onClick={handleStartJourney}
                  disabled={starting || !origin || route.status !== "ready"}
                >
                  {starting ? "Starting…" : t.startSafeWalk}
                </Button>
              </>
            )}
          </section>
        )}
      </SafeWalkMapProvider>

      {guardiansLoaded &&
        (guardians.length > 0 ? (
          <Card padding="sm" className="mb-6">
            <p className="mb-3 text-sm font-semibold text-foreground">
              {t.yourGuardians}
              <span className="ml-1.5 font-normal text-muted">({guardians.length})</span>
            </p>
            <div className="flex flex-col gap-2">
              {guardians.map((g) => (
                <div key={g.uid} className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                    {g.name.charAt(0)}
                  </span>
                  <span className="text-sm text-foreground">{g.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Guardians receive a notification when you start, arrive, end, or cancel a walk.
            </p>
          </Card>
        ) : (
          <Card padding="sm" className="mb-6 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">No guardian linked</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Safe Walk works best with a linked guardian who can follow your journey live and
                  get notified if something feels off. You can still start a Safe Walk without
                  one —{" "}
                  <Link href={ROUTES.family} className="font-semibold underline underline-offset-2">
                    link a guardian
                  </Link>{" "}
                  anytime.
                </p>
              </div>
            </div>
          </Card>
        ))}

      {guardianWalks.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Family Journeys
          </h2>
          <div className="flex flex-col gap-2">
            {guardianWalks.map((walk) => {
              const walkRemainingMeters = haversineDistanceMeters(
                walk.currentLocation,
                walk.destination
              );
              return (
                <Card key={walk.id} padding="sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {walk.walkerName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        To {walk.destination.address}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDistance(walkRemainingMeters)} remaining · ETA{" "}
                        {formatDurationShort(estimateWalkingSeconds(walkRemainingMeters))}
                      </p>
                    </div>
                    <Button size="sm" href={safeWalkTrackRoute(walk.id)}>
                      View Live
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
