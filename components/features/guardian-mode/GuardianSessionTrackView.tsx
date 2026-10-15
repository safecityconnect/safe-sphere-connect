"use client";

import { useEffect, useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { SafeWalkMapProvider } from "@/components/features/safe-walk/SafeWalkMapProvider";
import { SafeWalkMapView } from "@/components/features/safe-walk/SafeWalkMapView";
import { ROUTES } from "@/lib/constants";
import type { GuardianModeSession } from "@/lib/guardian-mode";
import { formatLocationAge } from "@/lib/guardian-mode-helpers";

/** Guardian-side live view of a Guardian Mode session (no destination or route). */
export function GuardianSessionTrackView({ session }: { session: GuardianModeSession }) {
  const isActive = session.status === "active";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, [isActive]);

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title={`${session.walkerName}'s live location`}
        subtitle={isActive ? "Guardian Mode is on" : "Guardian Mode has ended"}
        backHref={ROUTES.guardianMode}
      />

      <Card padding="none" className="mb-6 overflow-hidden">
        <SafeWalkMapProvider>
          <SafeWalkMapView current={session.currentLocation} />
        </SafeWalkMapProvider>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge variant={isActive ? "success" : "info"}>{isActive ? "Live" : "Ended"}</Badge>
            <span className="text-xs text-muted">
              Updated {formatLocationAge(session.locationUpdatedAt?.toDate?.() ?? null, now)}
            </span>
          </div>
          <p className="flex items-start gap-2 text-sm text-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {session.currentLocation
              ? `${session.currentLocation.lat.toFixed(5)}, ${session.currentLocation.lng.toFixed(5)}${
                  session.locationAccuracyMeters !== null ? ` (±${session.locationAccuracyMeters} m)` : ""
                }`
              : "Waiting for the first location update"}
          </p>
        </div>
      </Card>

      <Card padding="sm" className="bg-primary-light/30">
        <p className="text-sm text-foreground">
          <ShieldCheck className="mr-1 inline h-4 w-4 text-primary" />
          {isActive
            ? `${session.walkerName} is sharing their live location with you until they end Guardian Mode.`
            : `${session.walkerName} ended Guardian Mode. This is the last location they shared.`}
        </p>
      </Card>
    </PageContainer>
  );
}
