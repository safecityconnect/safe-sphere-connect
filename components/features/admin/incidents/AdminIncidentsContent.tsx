"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { listIncidentsByVerificationStatus } from "@/lib/incidents";
import type { Incident, VerificationStatus } from "@/lib/types/incident";
import { IncidentReviewCard } from "./IncidentReviewCard";
import { IncidentReviewPanel } from "./IncidentReviewPanel";

const TABS = [
  { id: "pending" as const, label: "Pending" },
  { id: "verified" as const, label: "Approved" },
  { id: "rejected" as const, label: "Rejected" },
] satisfies { id: VerificationStatus; label: string }[];

type Tab = (typeof TABS)[number]["id"];

export function AdminIncidentsContent() {
  const [tab, setTab] = useState<Tab>("pending");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTab = useCallback(async (status: Tab) => {
    setLoading(true);
    setError(null);
    setExpandedId(null);
    try {
      const results = await listIncidentsByVerificationStatus(status);
      setIncidents(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(tab);
  }, [tab, fetchTab]);

  function handleReviewed(id: string) {
    setIncidents((prev) => prev.filter((inc) => inc.id !== id));
    setExpandedId(null);
  }

  const pendingCount = tab === "pending" ? incidents.length : null;
  const subtitle =
    tab === "pending"
      ? "Review and approve or reject submitted reports"
      : tab === "verified"
        ? "Approved reports visible in the community feed"
        : "Rejected reports hidden from the community feed";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Incidents"
        subtitle={
          pendingCount !== null && pendingCount > 0
            ? `${pendingCount} pending review`
            : subtitle
        }
      />

      <FilterChips
        options={TABS}
        value={tab}
        onChange={(v) => setTab(v)}
        className="mb-6"
      />

      {loading && <ListSkeleton count={4} />}

      {!loading && error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">{error}</p>
      )}

      {!loading && !error && incidents.length === 0 && (
        <EmptyState
          icon={AlertTriangle}
          title={
            tab === "pending"
              ? "No pending incidents"
              : tab === "verified"
                ? "No approved incidents"
                : "No rejected incidents"
          }
          description={
            tab === "pending"
              ? "All submitted reports have been reviewed."
              : "Items reviewed will appear here."
          }
        />
      )}

      {!loading && !error && incidents.length > 0 && (
        <div className="flex flex-col gap-2">
          {incidents.map((incident) => {
            const expanded = expandedId === incident.id;
            return (
              <div key={incident.id}>
                <IncidentReviewCard
                  incident={incident}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : incident.id)}
                />
                {expanded && (
                  <IncidentReviewPanel
                    incident={incident}
                    onReviewed={handleReviewed}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
