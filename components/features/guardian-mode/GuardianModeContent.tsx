"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Eye, MapPin, Phone, Power, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLocale } from "@/components/providers/LocaleProvider";
import { INDIAN_EMERGENCY_SERVICES, PRIMARY_EMERGENCY_NUMBER } from "@/lib/emergency-services";
import { ROUTES, safeWalkTrackRoute } from "@/lib/constants";
import { getUserName } from "@/lib/family";
import { auth } from "@/lib/firebase";
import {
  endGuardianModeSession,
  getActiveGuardianModeSession,
  startGuardianModeSession,
  subscribeToGuardedSessions,
  subscribeToGuardianModeSession,
  updateGuardianModeLocation,
  type GuardianModeSession,
} from "@/lib/guardian-mode";
import { formatLocationAge, shouldWriteGuardianLocation } from "@/lib/guardian-mode-helpers";
import { getSafeWalkGuardians } from "@/lib/safe-walk";
import type { GeoPoint, SafeWalkGuardian } from "@/lib/types/safe-walk";

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 10_000,
    });
  });
}

function startErrorMessage(error: unknown): string {
  if (typeof GeolocationPositionError !== "undefined" && error instanceof GeolocationPositionError) {
    return error.code === error.PERMISSION_DENIED
      ? "Location permission is needed to share your live location. Allow location access and try again."
      : "Your location could not be found. Check your connection or GPS and try again.";
  }
  return error instanceof Error ? error.message : "Guardian Mode could not be started. Please try again.";
}

function formatStartTime(session: GuardianModeSession): string {
  const date = session.startedAt?.toDate?.();
  return date
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "just now";
}

export function GuardianModeContent() {
  const { t } = useLocale();
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [guardians, setGuardians] = useState<SafeWalkGuardian[] | null>(null);
  const [session, setSession] = useState<GuardianModeSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [guardedSessions, setGuardedSessions] = useState<GuardianModeSession[]>([]);
  const [busy, setBusy] = useState<"starting" | "ending" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastWriteRef = useRef<{ location: GeoPoint; time: number } | null>(null);

  const activeSession = session?.status === "active" ? session : null;

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);

  // Guardians, any session to resume, and sessions this user is guarding.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getSafeWalkGuardians(uid)
      .then((list) => !cancelled && setGuardians(list))
      .catch(() => !cancelled && setGuardians([]));
    getActiveGuardianModeSession(uid)
      .then((found) => {
        if (cancelled) return;
        setSession(found);
        setSessionChecked(true);
      })
      .catch(() => !cancelled && setSessionChecked(true));
    const unsubscribe = subscribeToGuardedSessions(uid, setGuardedSessions);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid]);

  // Live session status (last location update time, ended elsewhere, …).
  useEffect(() => {
    if (!activeSession?.id) return;
    return subscribeToGuardianModeSession(activeSession.id, setSession);
  }, [activeSession?.id]);

  // Share live location while the session is active.
  useEffect(() => {
    if (!activeSession?.id || !navigator.geolocation) return;
    const sessionId = activeSession.id;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationWarning(null);
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const time = Date.now();
        if (!shouldWriteGuardianLocation(lastWriteRef.current, location, time)) return;
        lastWriteRef.current = { location, time };
        updateGuardianModeLocation(sessionId, location, Math.round(pos.coords.accuracy)).catch(
          () => setLocationWarning("Your latest location could not be sent. Retrying…")
        );
      },
      () =>
        setLocationWarning(
          "Live location is paused: location access is unavailable. Guardians see your last shared location."
        ),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeSession?.id]);

  // Keeps "updated Xs ago" labels fresh.
  useEffect(() => {
    if (!activeSession && guardedSessions.length === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, [activeSession, guardedSessions.length]);

  const handleStart = async () => {
    if (!uid || !guardians || guardians.length === 0 || busy) return;
    setBusy("starting");
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const accuracyMeters = Math.round(pos.coords.accuracy);
      const walkerName = await getUserName(uid);
      const guardianIds = guardians.map((guardian) => guardian.uid);
      const id = await startGuardianModeSession({
        walkerId: uid,
        walkerName,
        guardianIds,
        location,
        accuracyMeters,
      });
      lastWriteRef.current = { location, time: Date.now() };
      setSession({
        id,
        sessionType: "guardian-mode",
        walkerId: uid,
        walkerName,
        status: "active",
        currentLocation: location,
        locationAccuracyMeters: accuracyMeters,
        locationUpdatedAt: null,
        guardianIds,
        startedAt: null,
        endedAt: null,
        createdAt: null,
      });
    } catch (err) {
      setError(startErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleEnd = async () => {
    if (!activeSession || busy) return;
    setBusy("ending");
    setError(null);
    try {
      await endGuardianModeSession(activeSession);
      lastWriteRef.current = null;
      setSession(null);
      setLocationWarning(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guardian Mode could not be ended. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (uid === undefined || (uid && (guardians === null || !sessionChecked))) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title={t.guardianMode} subtitle={t.loading} backHref={ROUTES.dashboard} />
        <Skeleton className="mb-4 h-40 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </PageContainer>
    );
  }

  const guardianNames = (guardians ?? []).map((guardian) => guardian.name).join(", ");
  const hasGuardians = (guardians ?? []).length > 0;

  return (
    <PageContainer withBottomNav>
      <PageHeader title={t.guardianMode} subtitle={t.guardianModeSubtitle} backHref={ROUTES.dashboard} />

      {activeSession ? (
        <Card padding="md" className="mb-6 border-emerald-300 bg-emerald-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Guardian Mode is ON</p>
                <p className="text-xs text-emerald-800">Started {formatStartTime(activeSession)}</p>
              </div>
            </div>
            <Badge variant="success">Live</Badge>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 text-sm text-emerald-900">
            <p className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0" />
              Sharing live location with {activeSession.guardianIds.length} guardian
              {activeSession.guardianIds.length === 1 ? "" : "s"}
              {guardianNames ? `: ${guardianNames}` : ""}
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              Last location update:{" "}
              {formatLocationAge(activeSession.locationUpdatedAt?.toDate?.() ?? null, now)}
              {activeSession.locationAccuracyMeters !== null
                ? ` (±${activeSession.locationAccuracyMeters} m)`
                : ""}
            </p>
          </div>

          {locationWarning && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{locationWarning}</p>
          )}

          <Button
            variant="danger"
            fullWidth
            className="mt-4"
            onClick={handleEnd}
            disabled={busy !== null}
          >
            <Power className="h-4 w-4" />
            {busy === "ending" ? "Ending…" : "End Guardian Mode"}
          </Button>
        </Card>
      ) : (
        <Card padding="md" className="mb-6 border-primary/30 bg-primary-light/40">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Guardian Mode is off</p>
              <p className="text-xs text-muted">
                Starting it notifies your linked guardians and shares your live location until you end it.
              </p>
            </div>
          </div>

          {hasGuardians ? (
            <p className="mt-3 text-xs text-muted">Guardians: {guardianNames}</p>
          ) : (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No guardian is linked yet. Link a guardian on the Family page to use Guardian Mode.
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            className="mt-4"
            onClick={handleStart}
            disabled={!uid || !hasGuardians || busy !== null}
          >
            <ShieldCheck className="h-5 w-5" />
            {busy === "starting" ? "Starting…" : "Start Guardian Mode"}
          </Button>
          {!hasGuardians && (
            <Button variant="outline" size="sm" fullWidth className="mt-2" href={ROUTES.family}>
              <UserPlus className="h-4 w-4" />
              Link a guardian
            </Button>
          )}
        </Card>
      )}

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {guardedSessions.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">People you are guarding</h2>
          <div className="flex flex-col gap-2">
            {guardedSessions.map((guarded) => (
              <Card key={guarded.id} padding="sm" className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{guarded.walkerName}</p>
                  <p className="text-xs text-muted">
                    Guardian Mode on · updated{" "}
                    {formatLocationAge(guarded.locationUpdatedAt?.toDate?.() ?? null, now)}
                  </p>
                </div>
                <Button variant="outline" size="sm" href={safeWalkTrackRoute(guarded.id)}>
                  <Eye className="h-4 w-4" />
                  View live location
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Card padding="sm" className="mb-6 border-primary/30 bg-primary-light/40">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
            <Phone className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">{t.call112}</p>
            <p className="text-sm text-muted">{t.call112Desc}</p>
          </div>
          <Button variant="primary" size="sm" href={PRIMARY_EMERGENCY_NUMBER.tel}>
            {t.call112}
          </Button>
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t.emergencyServices}</h2>
        <div className="flex flex-col gap-2">
          {INDIAN_EMERGENCY_SERVICES.map((service) => (
            <Card key={service.number} padding="sm" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-sm font-bold text-primary">
                  {service.number}
                </div>
                <div>
                  <p className="font-medium text-foreground">{service.label}</p>
                  <p className="text-xs text-muted">{service.description}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" href={service.tel} className="!px-3">
                <Phone className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <Card padding="sm" className="flex items-center gap-3 bg-accent-light/50">
        <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
        <p className="text-sm text-foreground">
          Your location is shared only with your linked guardians, and only while Guardian Mode is on.
          Guardians are notified in the app; no SMS is sent.
        </p>
      </Card>
    </PageContainer>
  );
}
