"use client";

import { CalendarDays, ChevronDown, ChevronUp, ImageIcon, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { incidentCategory, incidentLocation, type Incident, type VerificationStatus } from "@/lib/types/incident";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const STATUS_VARIANT: Record<VerificationStatus, BadgeVariant> = {
  pending: "warning",
  verified: "success",
  rejected: "danger",
};

function formatDate(ts: Incident["createdAt"]): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  incident: Incident;
  expanded: boolean;
  onToggle: () => void;
};

export function IncidentReviewCard({ incident, expanded, onToggle }: Props) {
  return (
    <Card
      padding="md"
      className={cn("cursor-pointer transition-shadow hover:shadow-md", expanded && "ring-1 ring-primary/30")}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground leading-snug">{incident.title}</h3>
            <Badge variant={STATUS_VARIANT[incident.verificationStatus]} className="capitalize shrink-0">
              {incident.verificationStatus}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <Badge variant="info">{incidentCategory(incident)}</Badge>

            {incident.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {incident.city}
              </span>
            )}

            {incidentLocation(incident) !== "—" && (
              <span className="truncate max-w-[200px]">{incidentLocation(incident)}</span>
            )}

            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatDate(incident.createdAt)}
            </span>

            {incident.imageUrls && incident.imageUrls.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                {incident.imageUrls.length}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-muted">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
    </Card>
  );
}
