"use client";

import { useEffect, useMemo, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapPinned, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocationPickerModal } from "@/components/features/report-incident/LocationPickerModal";
import { useAreaHealth } from "@/hooks/useAreaHealth";
import { INDIA_CENTER } from "@/lib/map/city-centers";
import {
  formatRouteSelectionDebug,
  selectSafestReasonableRoute,
  type RouteSafetyCandidate,
} from "@/lib/safe-route-recommendation";
import type { GeoPoint, SafeWalkDestination } from "@/lib/types/safe-walk";
import { DestinationSearch } from "./DestinationSearch";
import { SafeWalkMapView } from "./SafeWalkMapView";
import {
  IDLE_WALKING_ROUTE,
  useWalkingRoute,
  type WalkingRouteResult,
} from "./useWalkingRoute";

type JourneyPlannerProps = {
  origin: GeoPoint | null;
  destination: SafeWalkDestination | null;
  onDestinationChange: (destination: SafeWalkDestination | null) => void;
  onRouteChange: (route: WalkingRouteResult) => void;
};

function toSafetyCandidates(
  route: WalkingRouteResult,
  sectorHints: string[]
): RouteSafetyCandidate[] {
  return route.candidates.map((candidate) => ({
    id: candidate.id,
    path: candidate.path,
    distanceMeters: candidate.distanceMeters,
    distanceText: candidate.distanceText,
    durationSeconds: candidate.durationSeconds,
    durationText: candidate.durationText,
    provider: route.provider,
    sectorHints,
  }));
}

/**
 * Destination-selection + route-preview step of Safe Walk. Rendered inside
 * `SafeWalkMapProvider` so it (and its children) can use `useMapsLibrary`
 * for Places search, reverse geocoding, and Directions.
 */
export function JourneyPlanner({
  origin,
  destination,
  onDestinationChange,
  onRouteChange,
}: JourneyPlannerProps) {
  const geocodingLibrary = useMapsLibrary("geocoding");
  const googleRoute = useWalkingRoute(origin, destination, {
    provideRouteAlternatives: true,
  });
  const { snapshot: areaHealth, loading: areaHealthLoading } = useAreaHealth();
  const [showPicker, setShowPicker] = useState(false);

  const selection = useMemo(() => {
    if (googleRoute.status !== "ready" || !destination) return null;
    return selectSafestReasonableRoute(
      toSafetyCandidates(googleRoute, [destination.address]),
      areaHealth
    );
  }, [areaHealth, destination, googleRoute]);

  const selectedRoute = useMemo((): WalkingRouteResult => {
    if (!destination) return IDLE_WALKING_ROUTE;
    if (googleRoute.status !== "ready" || areaHealthLoading || !selection) {
      return googleRoute.status === "idle" ? IDLE_WALKING_ROUTE : { ...googleRoute, status: "loading" };
    }
    const selected = selection.selectedCandidate;
    return {
      ...googleRoute,
      status: "ready",
      distanceMeters: selected.distanceMeters,
      distanceText: selected.distanceText,
      durationSeconds: selected.durationSeconds,
      durationText: selected.durationText,
      path: selected.path,
    };
  }, [areaHealthLoading, destination, googleRoute, selection]);

  useEffect(() => {
    onRouteChange(selectedRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute]);

  useEffect(() => {
    if (!selection) return;
    console.info(formatRouteSelectionDebug(selection));
  }, [selection]);

  const handlePinConfirm = (coords: GeoPoint) => {
    setShowPicker(false);

    if (!geocodingLibrary) {
      onDestinationChange({
        ...coords,
        address: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
      });
      return;
    }

    const geocoder = new geocodingLibrary.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      const address =
        status === "OK" && results?.[0]?.formatted_address
          ? results[0].formatted_address
          : `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      onDestinationChange({ ...coords, address });
    });
  };

  if (!destination) {
    return (
      <div className="flex flex-col gap-3">
        <DestinationSearch onSelect={onDestinationChange} />

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" onClick={() => setShowPicker(true)}>
          <MapPinned className="h-4 w-4" />
          Pick a location on the map
        </Button>

        {showPicker && (
          <LocationPickerModal
            initialCenter={origin ?? INDIA_CENTER}
            onConfirm={handlePinConfirm}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    );
  }

  const recommendation = selection?.selected ?? null;
  const fastestDiffers =
    Boolean(selection?.comparedMultiple) &&
    selection?.selectedCandidate.id !== selection?.fastestCandidate.id;
  const comparisonPath = fastestDiffers ? selection?.fastestCandidate.path : undefined;

  return (
    <div className="flex flex-col gap-3">
      <Card padding="sm" className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Destination</p>
          <p className="truncate text-sm font-medium text-foreground">{destination.address}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPicker(true)}
            aria-label="Adjust pin on map"
          >
            <MapPinned className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDestinationChange(null)}>
            Change
          </Button>
        </div>
      </Card>

      <SafeWalkMapView
        origin={origin}
        destination={destination}
        path={selectedRoute.path}
        comparisonPath={comparisonPath}
        className="h-52 w-full sm:h-60"
      />

      <Card
        padding="md"
        className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
      >
        {selectedRoute.status !== "ready" || !recommendation ? (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Comparing walking routes for safety…
          </span>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Recommended Safe Route</p>
                  <p className="text-[10px] text-muted">
                    {googleRoute.isEstimate
                      ? "Straight-line estimate"
                      : selection?.comparedMultiple
                        ? `Selected from ${selection.comparisons.length} Google walking routes`
                        : "Only walking route Google returned"}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  !recommendation.hasSafetyData
                    ? "info"
                    : recommendation.riskLevel === "Low"
                    ? "success"
                    : recommendation.riskLevel === "Moderate"
                      ? "warning"
                      : "danger"
                }
              >
                {recommendation.hasSafetyData
                  ? `${recommendation.riskLevel} Risk`
                  : "Limited Data"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 border-y border-emerald-200 py-3 text-center">
              {[
                {
                  label: "Safety Score",
                  value: recommendation.hasSafetyData
                    ? `${recommendation.safetyScore}/100`
                    : "—",
                },
                {
                  label: "Risk Level",
                  value: recommendation.hasSafetyData
                    ? recommendation.riskLevel
                    : "Unknown",
                },
                { label: "Distance", value: recommendation.distanceText },
                { label: "ETA", value: recommendation.durationText },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-sm font-bold text-foreground">{item.value}</p>
                  <p className="text-[10px] text-muted">{item.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-emerald-800">
              {recommendation.explanation}
            </p>
          </>
        )}
      </Card>

      {selection && selectedRoute.status === "ready" && (
        <Card padding="sm" className="border-slate-200 bg-slate-50">
          <p className="text-xs font-semibold text-foreground">Route comparison</p>
          <p className="mt-0.5 text-[10px] text-muted">
            {selection.comparisons.length === 1
              ? "1 Google walking candidate scored with Area Health"
              : `${selection.comparisons.length} Google walking candidates scored with Area Health`}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {selection.comparisons.map((row) => (
              <li
                key={row.candidateId}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{row.candidateId}</span>
                  <span className="flex flex-wrap justify-end gap-1">
                    {row.isSelected && <Badge variant="success">Selected</Badge>}
                    {row.isFastest && <Badge variant="info">Fastest</Badge>}
                    {!row.eligible && <Badge variant="warning">Too long</Badge>}
                  </span>
                </div>
                <p className="mt-1 text-muted">
                  {row.distanceText} · {row.durationText} · safety {row.safetyScore}/100
                </p>
                {row.ineligibleReason && (
                  <p className="mt-0.5 text-[10px] text-amber-700">{row.ineligibleReason}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
            Selected {selection.selected.candidateId}: {selection.reason}
          </p>
        </Card>
      )}

      {showPicker && (
        <LocationPickerModal
          initialCenter={destination}
          onConfirm={handlePinConfirm}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
