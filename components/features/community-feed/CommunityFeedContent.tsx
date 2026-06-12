"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { db } from "@/lib/firebase";
import { ROUTES } from "@/lib/constants";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

type Incident = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  createdAt: { toDate: () => Date } | null;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  open: "danger",
  resolved: "success",
  "in-progress": "warning",
};

function statusVariant(status: string): BadgeVariant {
  return STATUS_VARIANT[status.toLowerCase()] ?? "info";
}

function formatDate(ts: Incident["createdAt"]): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CommunityFeedContent() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        // Only show admin-approved public incidents.
        // Requires a composite Firestore index on (verificationStatus, visibility, createdAt DESC).
        const q = query(
          collection(db, "incidents"),
          where("verificationStatus", "==", "verified"),
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Incident, "id">),
        }));
        setIncidents(docs);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load incidents."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchIncidents();
  }, []);

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title="Community Feed"
        subtitle="Incidents reported by the community"
        backHref={ROUTES.dashboard}
      />

      {loading && <ListSkeleton count={4} />}

      {!loading && error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {!loading && !error && incidents.length === 0 && (
        <EmptyState
          icon={Users}
          title="No incidents yet"
          description="Be the first to report an incident and help keep the community safe."
        />
      )}

      {!loading && !error && incidents.length > 0 && (
        <div className="flex flex-col gap-3">
          {incidents.map((incident) => (
            <Card key={incident.id} padding="md">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground leading-snug">
                  {incident.title}
                </h3>
                <Badge variant={statusVariant(incident.status)} className="shrink-0 capitalize">
                  {incident.status}
                </Badge>
              </div>

              <p className="mt-1.5 text-sm text-muted line-clamp-2">
                {incident.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Badge variant="info">{incident.category}</Badge>
                </span>

                {incident.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {incident.location}
                  </span>
                )}

                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {formatDate(incident.createdAt)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
