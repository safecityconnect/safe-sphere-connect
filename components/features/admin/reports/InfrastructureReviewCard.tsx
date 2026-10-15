"use client";

import { CalendarDays, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type {
  InfrastructureReport,
  InfrastructureVerificationStatus,
} from "@/lib/types/infrastructure-report";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const STATUS_VARIANT: Record<InfrastructureVerificationStatus, BadgeVariant> = {
  pending: "warning",
  verified: "success",
  rejected: "danger",
};

function formatDate(ts: InfrastructureReport["createdAt"]): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  report: InfrastructureReport;
  expanded: boolean;
  onToggle: () => void;
};

export function InfrastructureReviewCard({ report, expanded, onToggle }: Props) {
  return (
    <Card
      padding="md"
      className={cn("cursor-pointer transition-shadow hover:shadow-md", expanded && "ring-1 ring-primary/30")}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground leading-snug">{report.title}</h3>
            <Badge variant={STATUS_VARIANT[report.verificationStatus]} className="capitalize shrink-0">
              {report.verificationStatus}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <Badge variant="info">{report.category}</Badge>

            {report.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {report.city}
              </span>
            )}

            {report.locationText && (
              <span className="truncate max-w-[200px]">{report.locationText}</span>
            )}

            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatDate(report.createdAt)}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-muted">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
    </Card>
  );
}
