export type VerificationStatus = "pending" | "verified" | "rejected";
export type IncidentVisibility = "pending" | "public" | "hidden";
export type IncidentStatus = "open" | "in-progress" | "resolved";

export type Incident = {
  id: string;
  title: string;
  description: string;
  /** Canonical category field */
  incidentCategory: string;
  /** Legacy field — fall back to this when incidentCategory is absent */
  category?: string;
  /** Canonical location field */
  locationText: string;
  /** Legacy field */
  location?: string;
  city: string;
  severity: "low" | "medium" | "high";
  markerType: string;
  verificationStatus: VerificationStatus;
  visibility: IncidentVisibility;
  status: IncidentStatus;
  userId: string;
  createdAt: { toDate: () => Date } | null;
  updatedAt: { toDate: () => Date } | null;
  reviewedBy?: string;
  reviewedAt?: { toDate: () => Date } | null;
  reviewNotes?: string;
};

export function incidentCategory(incident: Incident): string {
  return incident.incidentCategory || incident.category || "—";
}

export function incidentLocation(incident: Incident): string {
  return incident.locationText || incident.location || "—";
}
