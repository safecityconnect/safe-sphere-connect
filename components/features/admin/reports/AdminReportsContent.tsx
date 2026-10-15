"use client";

import { useCallback, useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { listInfrastructureReportsByVerificationStatus } from "@/lib/infrastructure-reports";
import type {
  InfrastructureReport,
  InfrastructureVerificationStatus,
} from "@/lib/types/infrastructure-report";
import { InfrastructureReviewCard } from "./InfrastructureReviewCard";
import { InfrastructureReviewPanel } from "./InfrastructureReviewPanel";

const TABS = [
  { id: "pending" as const, label: "Pending" },
  { id: "verified" as const, label: "Approved" },
  { id: "rejected" as const, label: "Rejected" },
] satisfies { id: InfrastructureVerificationStatus; label: string }[];

type Tab = (typeof TABS)[number]["id"];

export function AdminReportsContent() {
  const [tab, setTab] = useState<Tab>("pending");
  const [reports, setReports] = useState<InfrastructureReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTab = useCallback(async (status: Tab) => {
    setLoading(true);
    setError(null);
    setExpandedId(null);
    try {
      const results = await listInfrastructureReportsByVerificationStatus(status);
      setReports(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load civic reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(tab);
  }, [tab, fetchTab]);

  function handleReviewed(id: string, _action: "approved" | "rejected") {
    setReports((prev) => prev.filter((report) => report.id !== id));
    setExpandedId(null);
  }

  const pendingCount = tab === "pending" ? reports.length : null;
  const subtitle =
    tab === "pending"
      ? "Review and approve or reject Fix My City submissions"
      : tab === "verified"
        ? "Approved reports visible on the Safety Map and Area Health"
        : "Rejected reports hidden from public views";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Civic Reports"
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

      {!loading && !error && reports.length === 0 && (
        <EmptyState
          icon={Wrench}
          title={
            tab === "pending"
              ? "No pending civic reports"
              : tab === "verified"
                ? "No approved civic reports"
                : "No rejected civic reports"
          }
          description={
            tab === "pending"
              ? "All submitted Fix My City reports have been reviewed."
              : "Items reviewed will appear here."
          }
        />
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="flex flex-col gap-2">
          {reports.map((report) => {
            const expanded = expandedId === report.id;
            return (
              <div key={report.id}>
                <InfrastructureReviewCard
                  report={report}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : report.id)}
                />
                {expanded && (
                  <InfrastructureReviewPanel
                    report={report}
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
