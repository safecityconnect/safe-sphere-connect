export type InfrastructureReportStatus = "submitted" | "in-progress" | "resolved";
export type InfrastructureReportSeverity = "low" | "medium" | "high";
export type InfrastructureVerificationStatus = "pending" | "verified" | "rejected";
export type InfrastructureVisibility = "pending" | "public" | "hidden";

export function infrastructureSeverityForCategory(
  category: string
): InfrastructureReportSeverity {
  const normalized = category.toLowerCase();
  if (normalized.includes("manhole") || normalized.includes("unsafe")) return "high";
  if (
    normalized.includes("light") ||
    normalized.includes("pothole") ||
    normalized.includes("water") ||
    normalized.includes("traffic")
  ) {
    return "medium";
  }
  return "low";
}

export type InfrastructureReport = {
  id: string;
  title: string;
  description: string;
  category: string;
  locationText: string;
  city: string;
  latitude?: number;
  longitude?: number;
  severity: InfrastructureReportSeverity;
  status: InfrastructureReportStatus;
  verificationStatus: InfrastructureVerificationStatus;
  visibility: InfrastructureVisibility;
  userId: string;
  createdAt: { toDate: () => Date } | null;
  updatedAt: { toDate: () => Date } | null;
  reviewedBy?: string;
  reviewedAt?: { toDate: () => Date } | null;
  reviewNotes?: string;
};
