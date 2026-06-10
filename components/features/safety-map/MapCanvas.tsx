"use client";

import { MapPin, Navigation } from "lucide-react";
import type { IndianCity, MapIncident, MapMarkerType } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

const markerColors: Record<MapMarkerType, string> = {
  incident: "bg-red-500 ring-red-200",
  "safe-zone": "bg-emerald-500 ring-emerald-200",
  hazard: "bg-amber-500 ring-amber-200",
  "police-station": "bg-blue-600 ring-blue-200",
};

type MapCanvasProps = {
  incidents: MapIncident[];
  selectedId?: string | null;
  city: IndianCity;
  onSelect?: (id: string) => void;
};

export function MapCanvas({ incidents, selectedId, city, onSelect }: MapCanvasProps) {
  return (
    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-100 via-primary-light/40 to-emerald-50 sm:h-72">
      <svg className="absolute inset-0 h-full w-full opacity-20" aria-hidden="true">
        <defs>
          <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#0d6e8a" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
      </svg>

      <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
        <path
          d="M0,120 Q80,80 160,100 T320,90 T480,110"
          fill="none"
          stroke="#0d6e8a"
          strokeWidth="3"
        />
        <path
          d="M0,180 Q120,150 240,170 T480,160"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
        />
      </svg>

      {incidents.map((incident) => (
        <button
          key={incident.id}
          type="button"
          onClick={() => onSelect?.(incident.id)}
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
          style={{ left: `${incident.x}%`, top: `${incident.y}%` }}
          aria-label={`${incident.type} at ${incident.location}`}
        >
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full ring-4",
              markerColors[incident.category],
              selectedId === incident.id && "scale-125 ring-offset-2"
            )}
          />
        </button>
      ))}

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <span className="absolute -inset-3 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white">
            <Navigation className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 rounded-lg bg-surface/90 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
        <MapPin className="mr-1 inline h-3 w-3 text-primary" />
        {city}
      </div>
    </div>
  );
}
