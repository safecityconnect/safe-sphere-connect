import type { MapMarkerType } from "@/lib/sample-data";

export type MarkerPinStyle = {
  background: string;
  borderColor: string;
  glyphColor: string;
};

export const MARKER_PIN_STYLES: Record<MapMarkerType, MarkerPinStyle> = {
  incident: {
    background: "#ef4444",
    borderColor: "#fecaca",
    glyphColor: "#ffffff",
  },
  "safe-zone": {
    background: "#10b981",
    borderColor: "#a7f3d0",
    glyphColor: "#ffffff",
  },
  hazard: {
    background: "#f59e0b",
    borderColor: "#fde68a",
    glyphColor: "#ffffff",
  },
  "police-station": {
    background: "#2563eb",
    borderColor: "#bfdbfe",
    glyphColor: "#ffffff",
  },
};

export const MARKER_TAILWIND_COLORS: Record<MapMarkerType, string> = {
  incident: "bg-red-500 ring-red-200",
  "safe-zone": "bg-emerald-500 ring-emerald-200",
  hazard: "bg-amber-500 ring-amber-200",
  "police-station": "bg-blue-600 ring-blue-200",
};
