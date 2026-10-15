"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
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
import { useLocale } from "@/components/providers/LocaleProvider";
import { ROUTES } from "@/lib/constants";
import { auth } from "@/lib/firebase";
import {
  createInfrastructureReport,
  listInfrastructureReportsForUser,
} from "@/lib/infrastructure-reports";
import { INDIAN_CITIES, REPORT_CATEGORIES } from "@/lib/sample-data";
import { getCityCenter, type LatLng } from "@/lib/map/city-centers";
import type {
  InfrastructureReport,
  InfrastructureReportStatus,
} from "@/lib/types/infrastructure-report";
import { infrastructureSeverityForCategory } from "@/lib/types/infrastructure-report";
import { cn } from "@/lib/utils";
import { LocationPickerModal } from "@/components/features/report-incident/LocationPickerModal";

const statusVariant = {
  "in-progress": "warning" as const,
  submitted: "info" as const,
  resolved: "success" as const,
};

const statusSteps = ["submitted", "in-progress", "resolved"] as const;
const statusLabel: Record<InfrastructureReportStatus, string> = {
  submitted: "Submitted",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

function StatusProgress({ status }: { status: InfrastructureReportStatus }) {
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

function reportDate(report: InfrastructureReport): string {
  if (!report.createdAt) return "Just now";
  return report.createdAt.toDate().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FixMyCityContent() {
  const { t } = useLocale();
  const [category, setCategory] = useState<string>("All");
  const [showForm, setShowForm] = useState(false);
  const [reports, setReports] = useState<InfrastructureReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    category: string;
    city: (typeof INDIAN_CITIES)[number];
    locationText: string;
    description: string;
  }>({
    title: "",
    category: REPORT_CATEGORIES[1],
    city: INDIAN_CITIES[0],
    locationText: "",
    description: "",
  });

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setReports([]);
          setIsLoading(false);
          return;
        }
        try {
          setReports(await listInfrastructureReportsForUser(user.uid));
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load infrastructure reports."
          );
        } finally {
          setIsLoading(false);
        }
      }),
    []
  );

  const filtered = useMemo(() => {
    if (category === "All") return reports;
    return reports.filter((report) => report.category === category);
  }, [category, reports]);

  const stats = useMemo(
    () => ({
      submitted: reports.filter((report) => report.status === "submitted").length,
      inProgress: reports.filter((report) => report.status === "in-progress").length,
      resolved: reports.filter((report) => report.status === "resolved").length,
    }),
    [reports]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const missingFields = [
      ["Issue Title", form.title],
      ["Location", form.locationText],
      ["Description", form.description],
    ]
      .filter(([, value]) => !value.trim())
      .map(([label]) => label);
    if (missingFields.length > 0) {
      setSubmitSuccess(false);
      setError(`Please fill in: ${missingFields.join(", ")}.`);
      return;
    }

    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      setError("You must be signed in to submit a report.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSubmitSuccess(false);
    try {
      const id = await createInfrastructureReport({
        ...form,
        userId: user.uid,
        ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      });
      setReports((current) => [
        {
          id,
          ...form,
          severity: infrastructureSeverityForCategory(form.category),
          status: "submitted",
          verificationStatus: "pending",
          visibility: "pending",
          userId: user.uid,
          ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
          createdAt: null,
          updatedAt: null,
        },
        ...current,
      ]);
      setForm({
        title: "",
        category: REPORT_CATEGORIES[1],
        city: INDIAN_CITIES[0],
        locationText: "",
        description: "",
      });
      setCoords(null);
      setShowForm(false);
      setSubmitSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the infrastructure report."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Button size="sm" onClick={() => { setShowForm(!showForm); setSubmitSuccess(false); }}>
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

      {error && !showForm && (
        <p className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {submitSuccess && (
        <p className="mb-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          Report submitted successfully. You can track it under My Reports.
        </p>
      )}

      {showForm ? (
        <Card className="mb-6" padding="md">
          <h3 className="font-semibold text-foreground">{t.newReport}</h3>
          <p className="mt-1 text-sm text-muted">
            Describe the issue and we&apos;ll route it to the right department.
          </p>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <Input
              label="Issue Title"
              placeholder="e.g. Broken streetlight"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              disabled={isSubmitting}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                disabled={isSubmitting}
              >
                {REPORT_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">City</label>
              <select
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.city}
                onChange={(event) =>
                  setForm({
                    ...form,
                    city: event.target.value as (typeof INDIAN_CITIES)[number],
                  })
                }
                disabled={isSubmitting}
              >
                {INDIAN_CITIES.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </div>
            <Input
              label="Location"
              placeholder="Sector, landmark, or street address"
              value={form.locationText}
              onChange={(event) => setForm({ ...form, locationText: event.target.value })}
              required
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLocationPicker(true)}
              disabled={isSubmitting}
            >
              <MapPin className="h-4 w-4" />
              {coords ? "Map location attached" : "Set exact map location"}
            </Button>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                className="min-h-[80px] w-full resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Provide details to help crews respond faster..."
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : t.submitReport}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card
          className="mb-6 cursor-pointer border-dashed border-2 border-primary/30 bg-primary-light/30 transition-colors hover:border-primary/50"
          padding="lg"
          onClick={() => {
            setSubmitSuccess(false);
            setShowForm(true);
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
              <Wrench className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-foreground">Report a New Issue</h3>
            <p className="mt-1 text-sm text-muted">
              Add location details and submit to your city.
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
            onAction={() => {
              setSubmitSuccess(false);
              setShowForm(true);
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((report) => (
              <Card key={report.id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{report.title}</p>
                      {report.status === "resolved" && (
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {report.locationText}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {reportDate(report)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {report.id.slice(0, 10).toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-muted">{report.description}</p>
                  </div>
                  <Badge variant={statusVariant[report.status]}>
                    {statusLabel[report.status]}
                  </Badge>
                </div>
                <StatusProgress status={report.status} />
              </Card>
            ))}
          </div>
        )}
      </section>

      {showLocationPicker && (
        <LocationPickerModal
          initialCenter={coords ?? getCityCenter(form.city)}
          onConfirm={(location) => {
            setCoords(location);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </PageContainer>
  );
}
