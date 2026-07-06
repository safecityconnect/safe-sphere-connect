"use client";

import { AlertTriangle, MapPin, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { IndianCity } from "@/lib/sample-data";
import { MARKER_TAILWIND_COLORS } from "@/lib/map/marker-styles";
import type { MapMarker } from "@/lib/map/incident-to-marker";
import { cn } from "@/lib/utils";

export type MapFallbackReason =
  | "missing-key"
  | "auth-failure"
  | "load-failed"
  | "timeout"
  | "network";

const FALLBACK_MESSAGES: Record<MapFallbackReason, { title: string; description: string }> = {
  "missing-key": {
    title: "Map unavailable",
    description:
      "The map could not load because the Google Maps API key is not configured. Incident data below is still available.",
  },
  "auth-failure": {
    title: "Map unavailable",
    description:
      "The map could not authenticate with Google Maps. Please check the API key configuration. Incident data below is still available.",
  },
  "load-failed": {
    title: "Map unavailable",
    description:
      "We couldn't load the map right now. This may be due to a service issue or exceeded quota. Incident data below is still available.",
  },
  timeout: {
    title: "Map is taking too long",
    description:
      "The map didn't load in time. Check your internet connection and try again. Incident data below is still available.",
  },
  network: {
    title: "No connection",
    description:
      "The map needs an internet connection to load. Incident data below is still available.",
  },
};

type MapFallbackProps = {
  reason: MapFallbackReason;
  city: IndianCity;
  markers?: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onRetry?: () => void;
};

export function MapFallback({
  reason,
  city,
  markers = [],
  selectedId,
  onSelect,
  onRetry,
}: MapFallbackProps) {
  const { title, description } = FALLBACK_MESSAGES[reason];
  const Icon = reason === "network" || reason === "timeout" ? WifiOff : AlertTriangle;

  return (
    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-100 via-primary-light/40 to-emerald-50 sm:h-72">
      <svg className="absolute inset-0 h-full w-full opacity-20" aria-hidden="true">
        <defs>
          <pattern id="map-grid-fallback" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#0d6e8a" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid-fallback)" />
      </svg>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface/90 text-amber-600 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-xs text-xs text-muted">{description}</p>
        {onRetry && (
          <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        )}
      </div>

      {markers.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {markers.map((marker, index) => {
            const cols = 4;
            const row = Math.floor(index / cols);
            const col = index % cols;
            const left = 15 + col * 22;
            const top = 20 + row * 25;

            return (
              <button
                key={marker.id}
                type="button"
                onClick={() => onSelect?.(marker.id)}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-label={`${marker.title} at ${marker.location}`}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full ring-4",
                    MARKER_TAILWIND_COLORS[marker.category],
                    selectedId === marker.id && "scale-125 ring-offset-2"
                  )}
                />
              </button>
            );
          })}
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-surface/90 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
        <MapPin className="mr-1 inline h-3 w-3 text-primary" />
        {city}
      </div>
    </div>
  );
}
