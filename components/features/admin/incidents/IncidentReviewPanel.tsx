"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { incidentCategory, incidentLocation, type Incident } from "@/lib/types/incident";
import { approveIncident, rejectIncident } from "@/lib/incidents";
import { auth } from "@/lib/firebase";

type Props = {
  incident: Incident;
  onReviewed: (id: string, action: "approved" | "rejected") => void;
};

export function IncidentReviewPanel({ incident, onReviewed }: Props) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminUid = auth.currentUser?.uid ?? "";

  const isReviewed = incident.verificationStatus !== "pending";

  async function handleApprove() {
    setLoading("approve");
    setError(null);
    try {
      await approveIncident(incident.id, adminUid, notes || undefined);
      onReviewed(incident.id, "approved");
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
      await rejectIncident(incident.id, adminUid, notes || undefined);
      onReviewed(incident.id, "rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-1 rounded-2xl border border-border bg-background px-5 py-4">
      <div className="space-y-1 text-sm text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <span className="font-medium text-foreground">Category: </span>
            {incidentCategory(incident)}
          </span>
          <span>
            <span className="font-medium text-foreground">Severity: </span>
            <Badge
              variant={
                incident.severity === "high"
                  ? "danger"
                  : incident.severity === "medium"
                    ? "warning"
                    : "success"
              }
              className="capitalize"
            >
              {incident.severity}
            </Badge>
          </span>
          <span>
            <span className="font-medium text-foreground">City: </span>
            {incident.city || "—"}
          </span>
          <span>
            <span className="font-medium text-foreground">Location: </span>
            {incidentLocation(incident)}
          </span>
        </div>

        <p className="pt-2 leading-relaxed">{incident.description || "No description provided."}</p>

        <p className="pt-1 text-xs">
          <span className="font-medium text-foreground">Reporter UID: </span>
          {incident.userId}
        </p>

        {incident.reviewNotes && (
          <p className="pt-1 text-xs">
            <span className="font-medium text-foreground">Review notes: </span>
            {incident.reviewNotes}
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
