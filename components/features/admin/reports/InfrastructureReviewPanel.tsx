"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { InfrastructureReport } from "@/lib/types/infrastructure-report";
import {
  approveInfrastructureReport,
  rejectInfrastructureReport,
} from "@/lib/infrastructure-reports";
import { auth } from "@/lib/firebase";

type Props = {
  report: InfrastructureReport;
  onReviewed: (id: string, action: "approved" | "rejected") => void;
};

export function InfrastructureReviewPanel({ report, onReviewed }: Props) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminUid = auth.currentUser?.uid ?? "";

  const isReviewed = report.verificationStatus !== "pending";

  async function handleApprove() {
    setLoading("approve");
    setError(null);
    try {
      await approveInfrastructureReport(report.id, adminUid, notes || undefined);
      onReviewed(report.id, "approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve.");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    setError(null);
    try {
      await rejectInfrastructureReport(report.id, adminUid, notes || undefined);
      onReviewed(report.id, "rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject.");
    } finally {
      setLoading(null);
    }
  }

  const hasCoordinates =
    typeof report.latitude === "number" &&
    typeof report.longitude === "number" &&
    Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude);

  return (
    <div className="mt-1 rounded-2xl border border-border bg-background px-5 py-4">
      <div className="space-y-1 text-sm text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <span className="font-medium text-foreground">Category: </span>
            {report.category}
          </span>
          <span>
            <span className="font-medium text-foreground">Severity: </span>
            <Badge
              variant={
                report.severity === "high"
                  ? "danger"
                  : report.severity === "medium"
                    ? "warning"
                    : "success"
              }
              className="capitalize"
            >
              {report.severity}
            </Badge>
          </span>
          <span>
            <span className="font-medium text-foreground">City: </span>
            {report.city || "—"}
          </span>
          <span>
            <span className="font-medium text-foreground">Location: </span>
            {report.locationText || "—"}
          </span>
          <span>
            <span className="font-medium text-foreground">Coordinates: </span>
            {hasCoordinates
              ? `${report.latitude!.toFixed(5)}, ${report.longitude!.toFixed(5)}`
              : "Not set"}
          </span>
        </div>

        <p className="pt-2 leading-relaxed">{report.description || "No description provided."}</p>

        <p className="pt-1 text-xs">
          <span className="font-medium text-foreground">Reporter UID: </span>
          {report.userId}
        </p>

        {report.reviewNotes && (
          <p className="pt-1 text-xs">
            <span className="font-medium text-foreground">Review notes: </span>
            {report.reviewNotes}
          </p>
        )}
      </div>

      {!isReviewed && (
        <div className="mt-4 space-y-3">
          <textarea
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={2}
            placeholder="Optional review notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading !== null}
          />

          {error && (
            <p className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleApprove}
              disabled={loading !== null}
            >
              <CheckCircle className="h-4 w-4" />
              {loading === "approve" ? "Approving…" : "Approve"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              disabled={loading !== null}
            >
              <XCircle className="h-4 w-4" />
              {loading === "reject" ? "Rejecting…" : "Reject"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
