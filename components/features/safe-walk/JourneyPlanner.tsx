"use client";

import { useEffect, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocationPickerModal } from "@/components/features/report-incident/LocationPickerModal";
import { INDIA_CENTER } from "@/lib/map/city-centers";
import type { GeoPoint, SafeWalkDestination } from "@/lib/types/safe-walk";
import { DestinationSearch } from "./DestinationSearch";
import { SafeWalkMapView } from "./SafeWalkMapView";
import { useWalkingRoute, type WalkingRouteResult } from "./useWalkingRoute";

type JourneyPlannerProps = {
  origin: GeoPoint | null;
  destination: SafeWalkDestination | null;
  onDestinationChange: (destination: SafeWalkDestination | null) => void;
  onRouteChange: (route: WalkingRouteResult) => void;
};

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
  const route = useWalkingRoute(origin, destination);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    onRouteChange(route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

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
        path={route.path}
        className="h-52 w-full sm:h-60"
      />

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
        {route.status !== "ready" ? (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Calculating route…
          </span>
        ) : (
          <>
            <span className="text-sm text-foreground">
              <strong>{route.distanceText}</strong> · ETA {route.durationText}
            </span>
            {route.isEstimate && (
              <span className="text-[10px] text-muted">Estimated</span>
            )}
          </>
        )}
      </div>

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
