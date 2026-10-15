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
  /** Fastest/normal Google walking path when it differs from the recommended one. */
  comparisonPath?: GeoPoint[];
  className?: string;
};

function pathKey(path: GeoPoint[]): string {
  if (path.length === 0) return "";
  const first = path[0];
  const last = path[path.length - 1];
  return `${path.length}:${first.lat},${first.lng}:${last.lat},${last.lng}`;
}

function MapCamera({
  target,
  paths,
}: {
  target: GeoPoint | null;
  paths: GeoPoint[][];
}) {
  const map = useMap();

  const pathsKey = paths.map(pathKey).join("|");

  useEffect(() => {
    if (!map) return;
    if (target) {
      map.panTo(target);
      return;
    }
    const drawable = paths.filter((path) => path.length > 1);
    if (drawable.length === 0 || typeof google === "undefined") return;
    const bounds = new google.maps.LatLngBounds();
    for (const path of drawable) {
      for (const point of path) bounds.extend(point);
    }
    if (!bounds.isEmpty()) map.fitBounds(bounds, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, target?.lat, target?.lng, pathsKey]);

  return null;
}

export function SafeWalkMapView({
  origin,
  destination,
  current,
  path = [],
  comparisonPath = [],
  className,
}: SafeWalkMapViewProps) {
  const defaultCenter = current ?? destination ?? origin ?? INDIA_CENTER;
  const showComparison = comparisonPath.length > 1 && pathKey(comparisonPath) !== pathKey(path);

  return (
    <div className={cn("relative h-56 w-full sm:h-64", className)}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={current ? 16 : destination ? 14 : 5}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        className="h-full w-full"
        reuseMaps
      >
        <MapCamera
          target={current ?? null}
          paths={current ? [path] : [comparisonPath, path]}
        />

        {showComparison && (
          <Polyline
            path={comparisonPath}
            strokeColor="#94a3b8"
            strokeOpacity={0}
            strokeWeight={4}
            zIndex={1}
            icons={[
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 0.85,
                  strokeColor: "#94a3b8",
                  scale: 3,
                },
                offset: "0",
                repeat: "14px",
              },
            ]}
          />
        )}

        {path.length > 1 && (
          <Polyline
            path={path}
            strokeColor="#059669"
            strokeOpacity={0.95}
            strokeWeight={5}
            zIndex={2}
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

      {showComparison && (
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] shadow-sm">
          <p className="flex items-center gap-1.5 text-emerald-800">
            <span className="inline-block h-0.5 w-4 rounded-full bg-emerald-600" />
            Recommended Safe Route
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-slate-500">
            <span className="inline-block w-4 border-t border-dashed border-slate-400" />
            Fastest walking route
          </p>
        </div>
      )}
    </div>
  );
}
