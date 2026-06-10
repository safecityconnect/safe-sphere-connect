"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Plus,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Input } from "@/components/ui/Input";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ROUTES } from "@/lib/constants";
import { CIVIC_REPORTS, INDIAN_CITIES, REPORT_CATEGORIES } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

const statusVariant = {
  "In Progress": "warning" as const,
  Submitted: "info" as const,
  Resolved: "success" as const,
};

const statusSteps = ["Submitted", "In Progress", "Resolved"] as const;

function StatusProgress({ status }: { status: keyof typeof statusVariant }) {
  const currentIndex = statusSteps.indexOf(status);

  return (
    <div className="mt-3 flex items-center gap-1">
      {statusSteps.map((step, index) => (
        <div key={step} className="flex flex-1 items-center gap-1">
          <div
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index <= currentIndex ? "bg-primary" : "bg-slate-100"
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function FixMyCityContent() {
  const { t } = useLocale();
  const isLoading = useSimulatedLoading();
  const [category, setCategory] = useState<string>("All");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    if (category === "All") return CIVIC_REPORTS;
    return CIVIC_REPORTS.filter((r) => r.category === category);
  }, [category]);

  const stats = useMemo(
    () => ({
      submitted: CIVIC_REPORTS.filter((r) => r.status === "Submitted").length,
      inProgress: CIVIC_REPORTS.filter((r) => r.status === "In Progress").length,
      resolved: CIVIC_REPORTS.filter((r) => r.status === "Resolved").length,
    }),
    []
  );

  if (isLoading) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title={t.fixMyCity} subtitle={t.loading} backHref={ROUTES.dashboard} />
        <div className="mb-6 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <ListSkeleton count={3} />
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title={t.fixMyCity}
        subtitle={t.fixMyCitySubtitle}
        backHref={ROUTES.dashboard}
        action={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Report
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Submitted", value: stats.submitted, color: "text-primary" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-600" },
          { label: "Resolved", value: stats.resolved, color: "text-emerald-600" },
        ].map((stat) => (
          <Card key={stat.label} padding="sm" className="text-center">
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      {showForm ? (
        <Card className="mb-6" padding="md">
          <h3 className="font-semibold text-foreground">{t.newReport}</h3>
          <p className="mt-1 text-sm text-muted">
            Describe the issue and we&apos;ll route it to the right department.
          </p>
          <form className="mt-4 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <Input label="Issue Title" placeholder="e.g. Broken streetlight" required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                {REPORT_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">City</label>
              <select className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                {INDIAN_CITIES.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </div>
            <Input label="Location" placeholder="Sector, landmark, or street address" required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                className="min-h-[80px] w-full resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Provide details to help crews respond faster..."
              />
            </div>
            <Card padding="sm" className="flex items-center gap-3 border-dashed bg-primary-light/20">
              <Camera className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Add Photo</p>
                <p className="text-xs text-muted">Tap to attach evidence (optional)</p>
              </div>
            </Card>
            <div className="flex gap-2">
              <Button type="button" variant="outline" fullWidth onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" fullWidth>
                {t.submitReport}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card
          className="mb-6 cursor-pointer border-dashed border-2 border-primary/30 bg-primary-light/30 transition-colors hover:border-primary/50"
          padding="lg"
          onClick={() => setShowForm(true)}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
              <Camera className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-foreground">Report a New Issue</h3>
            <p className="mt-1 text-sm text-muted">
              Snap a photo, add location details, and submit to your city.
            </p>
            <Button className="mt-4" size="sm">
              <Plus className="h-4 w-4" />
              {t.newReport}
            </Button>
          </div>
        </Card>
      )}

      <FilterChips
        options={REPORT_CATEGORIES.map((c) => ({ id: c, label: c }))}
        value={category}
        onChange={setCategory}
        className="mb-4"
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {t.myReports}
          <span className="ml-1.5 font-normal text-muted">({filtered.length})</span>
        </h2>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No reports in this category"
            description="You haven't filed any reports here yet. Tap below to report an issue in your neighborhood."
            actionLabel="Create Report"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((report) => (
              <Card key={report.id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{report.title}</p>
                      {report.status === "Resolved" && (
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {report.location}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {report.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {report.ticketId}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-muted">{report.description}</p>
                  </div>
                  <Badge variant={statusVariant[report.status]}>{report.status}</Badge>
                </div>
                <StatusProgress status={report.status} />
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
