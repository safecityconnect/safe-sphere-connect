import type { IncidentSeverity, MapMarkerType } from "@/lib/sample-data";
import type { Incident } from "@/lib/types/incident";
import type { InfrastructureReport } from "@/lib/types/infrastructure-report";
import type { LatLng } from "./city-centers";

export type MapMarker = {
  id: string;
  position: LatLng;
  category: MapMarkerType;
  title: string;
  location: string;
  severity: IncidentSeverity;
};

const VALID_MARKER_TYPES = new Set<string>([
  "incident",
  "safe-zone",
  "hazard",
  "police-station",
]);

function toMarkerType(raw: string): MapMarkerType {
  return VALID_MARKER_TYPES.has(raw) ? (raw as MapMarkerType) : "incident";
}

export function incidentHasCoordinates(incident: Incident): boolean {
  return (
    typeof incident.latitude === "number" &&
    typeof incident.longitude === "number" &&
    Number.isFinite(incident.latitude) &&
    Number.isFinite(incident.longitude)
  );
}

export function incidentToMarker(incident: Incident): MapMarker | null {
  if (!incidentHasCoordinates(incident)) return null;

  return {
    id: incident.id,
    position: { lat: incident.latitude!, lng: incident.longitude! },
    category: toMarkerType(incident.markerType),
    title: incident.title,
    location: incident.locationText || incident.location || "—",
    severity: (incident.severity as IncidentSeverity) ?? "medium",
  };
}

export function incidentsToMarkers(incidents: Incident[]): MapMarker[] {
  return incidents
    .map(incidentToMarker)
    .filter((marker): marker is MapMarker => marker !== null);
}

export function infrastructureHasCoordinates(
  report: InfrastructureReport
): boolean {
  return (
    typeof report.latitude === "number" &&
    typeof report.longitude === "number" &&
    Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude)
  );
}

export function infrastructureToMarker(
  report: InfrastructureReport
): MapMarker | null {
  if (!infrastructureHasCoordinates(report)) return null;

  return {
    id: report.id,
    position: { lat: report.latitude!, lng: report.longitude! },
    category: "hazard",
    title: report.title,
    location: report.locationText || "—",
    severity: report.severity,
  };
}

export function infrastructureReportsToMarkers(
  reports: InfrastructureReport[]
): MapMarker[] {
  return reports
    .map(infrastructureToMarker)
    .filter((marker): marker is MapMarker => marker !== null);
}
