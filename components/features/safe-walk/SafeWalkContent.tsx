"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  MapPin,
  Moon,
  Navigation,
  Pause,
  Phone,
  Play,
  Route,
  Shield,
  Square,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { ROUTES } from "@/lib/constants";
import {
  GUARDIANS,
  NIGHT_SAFETY_ALERTS,
  SAFE_ROUTES,
} from "@/lib/sample-data";
import { cn } from "@/lib/utils";

type WalkState = "idle" | "active" | "paused";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function SafeWalkContent() {
  const { t } = useLocale();
  const isLoading = useSimulatedLoading();
  const [walkState, setWalkState] = useState<WalkState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState(SAFE_ROUTES[0]);
  const destination = `${selectedRoute.to}, ${selectedRoute.city}`;
  const eta = selectedRoute.duration;

  const nightAlerts = NIGHT_SAFETY_ALERTS.filter(
    (a) => a.city === selectedRoute.city
  );

  useEffect(() => {
    if (walkState !== "active") return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [walkState]);

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
      <PageHeader
        title={t.safeWalk}
        subtitle={t.safeWalkSubtitle}
        backHref={ROUTES.dashboard}
      />

      <Card padding="sm" className="mb-6 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
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

      {nightAlerts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Moon className="h-4 w-4 text-indigo-600" />
            {t.nightSafetyAlerts}
          </h2>
          <div className="flex flex-col gap-2">
            {nightAlerts.map((alert) => (
              <Card
                key={alert.id}
                padding="sm"
                className={cn(
                  "border-l-4",
                  alert.severity === "high" && "border-l-danger bg-danger-light/30",
                  alert.severity === "medium" && "border-l-amber-500 bg-amber-50/50",
                  alert.severity === "low" && "border-l-primary bg-primary-light/30"
                )}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted">{alert.message}</p>
                    <p className="mt-1 text-[10px] text-muted">Active after {alert.activeAfter}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Route className="h-4 w-4 text-emerald-600" />
          {t.safeRoutes}
        </h2>
        <div className="flex flex-col gap-2">
          {SAFE_ROUTES.map((route) => (
            <Card
              key={route.id}
              padding="sm"
              className={cn(
                "cursor-pointer transition-colors",
                selectedRoute.id === route.id
                  ? "border-emerald-400 bg-emerald-50/50"
                  : "hover:border-primary/30"
              )}
              onClick={() => setSelectedRoute(route)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{route.title}</p>
                  <p className="text-xs text-muted">
                    {route.from} → {route.to}
                  </p>
                  <p className="mt-1 text-xs text-muted">{route.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant="success">{route.safetyScore}% safe</Badge>
                  <p className="mt-1 text-xs text-muted">
                    {route.distance} · {route.duration}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {walkState === "idle" ? (
        <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50" padding="lg">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t.readyToWalk}</p>
              <p className="text-sm text-muted">
                Start a session to share your live location with guardians.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            className="mt-4"
            onClick={() => {
              setWalkState("active");
              setElapsed(0);
            }}
          >
            <Play className="h-5 w-5" />
            {t.startSafeWalk}
          </Button>
        </Card>
      ) : (
        <Card className="mb-6 overflow-hidden border-emerald-300 bg-gradient-to-br from-emerald-500 to-teal-600 text-white" padding="none">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <Badge className="bg-white/20 text-white">
                {walkState === "active" ? t.walkInProgress : t.paused}
              </Badge>
              <span className="font-mono text-2xl font-bold">{formatTime(elapsed)}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Navigation className="h-5 w-5 text-white/80" />
              <div>
                <p className="text-sm text-white/70">{t.headingTo}</p>
                <p className="font-medium">{destination}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ETA {eta}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {GUARDIANS.filter((g) => g.status !== "Offline").length} watching
              </span>
            </div>
          </div>
          <div className="relative h-24 bg-emerald-600/50">
            <div className="absolute inset-0 opacity-30">
              <svg className="h-full w-full" aria-hidden="true">
                <pattern id="walk-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#walk-grid)" />
              </svg>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-emerald-600 shadow-lg">
                <Navigation className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 p-3">
            {walkState === "active" ? (
              <Button
                variant="outline"
                fullWidth
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setWalkState("paused")}
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                fullWidth
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setWalkState("active")}
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}
            <Button
              variant="outline"
              fullWidth
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={() => {
                setWalkState("idle");
                setElapsed(0);
              }}
            >
              <Square className="h-4 w-4" />
              End Walk
            </Button>
          </div>
        </Card>
      )}

      <Card padding="sm" className="mb-6 flex items-center gap-3">
        <MapPin className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{t.destination}</p>
          <p className="text-sm text-muted">{destination}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const currentIndex = SAFE_ROUTES.findIndex((r) => r.id === selectedRoute.id);
            const nextIndex = (currentIndex + 1) % SAFE_ROUTES.length;
            setSelectedRoute(SAFE_ROUTES[nextIndex]);
          }}
        >
          {t.change}
        </Button>
      </Card>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {t.yourGuardians}
            <span className="ml-1.5 font-normal text-muted">({GUARDIANS.length})</span>
          </h2>
          <Button variant="ghost" size="sm">
            <UserPlus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {GUARDIANS.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No guardians added"
            description="Add trusted contacts who can monitor your walk and receive alerts if you don't arrive on time."
            actionLabel="Add Guardian"
            onAction={() => {}}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {GUARDIANS.map((guardian) => (
              <Card key={guardian.id} padding="sm" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                      guardian.status === "Watching"
                        ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400"
                        : "bg-primary-light text-primary"
                    )}
                  >
                    {guardian.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{guardian.name}</p>
                    <p className="text-xs text-muted">{guardian.phone}</p>
                  </div>
                </div>
                <Badge
                  variant={
                    guardian.status === "Available"
                      ? "success"
                      : guardian.status === "Watching"
                        ? "info"
                        : "default"
                  }
                >
                  {guardian.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card padding="sm" className="bg-primary-light/30">
        <p className="text-sm text-foreground">
          <Shield className="mr-1 inline h-4 w-4 text-primary" />
          Guardians receive a notification when you start, pause, or end a walk. Dial 1091 for women helpline support anytime.
        </p>
      </Card>
    </PageContainer>
  );
}
