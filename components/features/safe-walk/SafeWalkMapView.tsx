"use client";

import { useEffect } from "react";
import { Map, Marker, Polyline, useMap } from "@vis.gl/react-google-maps";
import { INDIA_CENTER } from "@/lib/map/city-centers";
import type { GeoPoint } from "@/lib/types/safe-walk";
import { cn } from "@/lib/utils";

type SafeWalkMapViewProps = {
  origin?: GeoPoint | null;
  destination?: GeoPoint | null;
  /** Live/last-known position of the walker, if tracking has started. */
  current?: GeoPoint | null;
  path?: GeoPoint[];
  className?: string;
};

function MapCamera({ target }: { target: GeoPoint | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, target?.lat, target?.lng]);

  return null;
}

export function SafeWalkMapView({
  origin,
  destination,
  current,
  path = [],
  className,
}: SafeWalkMapViewProps) {
  const defaultCenter = current ?? destination ?? origin ?? INDIA_CENTER;

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={current ? 16 : destination ? 14 : 5}
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl
      className={cn("h-56 w-full sm:h-64", className)}
      reuseMaps
    >
      <MapCamera target={current ?? null} />

      {path.length > 1 && (
        <Polyline
          path={path}
          strokeColor="#0d6e8a"
          strokeOpacity={0.85}
          strokeWeight={4}
        />
      )}

      {origin && !current && <Marker position={origin} />}

      {current && (
        <Marker
          position={current}
          zIndex={10}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      )}

      {destination && <Marker position={destination} />}
    </Map>
  );
}
