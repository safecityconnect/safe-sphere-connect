"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAreaHealth } from "@/hooks/useAreaHealth";

export function AdminAreaHealthCard() {
  const { snapshot, loading, error } = useAreaHealth();

  if (loading) return <Skeleton className="h-72 rounded-2xl" />;

  return (
    <Card padding="md">
      <h2 className="mb-4 font-semibold text-foreground">Area Health Overview</h2>
      <div className="flex flex-col items-center py-6">
        <p className="text-5xl font-bold text-primary">{snapshot.overallScore}</p>
        <p className="mt-1 text-sm text-muted">Area Health Score</p>
        <Badge
          variant={
            snapshot.riskLevel === "Low"
              ? "success"
              : snapshot.riskLevel === "Moderate"
                ? "warning"
                : "danger"
          }
          className="mt-3"
        >
          {snapshot.reportCount === 0 ? "Limited Data" : `${snapshot.riskLevel} Risk`}
        </Badge>
      </div>
      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {[
          { label: "Verified Reports", value: snapshot.reportCount },
          { label: "Active Reports", value: snapshot.activeReportCount },
          { label: "Reported Sectors", value: snapshot.sectors.length },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-muted">{item.label}</span>
            <span className="font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-amber-700">{error}</p>}
    </Card>
  );
}
