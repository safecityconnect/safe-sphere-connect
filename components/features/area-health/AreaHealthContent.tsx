"use client";

import {
  Activity,
  AlertTriangle,
  MapPin,
  Shield,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useAreaHealth } from "@/hooks/useAreaHealth";
import { ROUTES } from "@/lib/constants";
import type { SafetyRiskLevel } from "@/lib/area-health";

const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  activity: Activity,
  wrench: Wrench,
};

const riskVariant: Record<
  SafetyRiskLevel,
  "success" | "warning" | "danger"
> = {
  Low: "success",
  Moderate: "warning",
  High: "danger",
  Critical: "danger",
};

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-100"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d6e8a" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{score}</span>
        <span className="text-sm text-muted">/ 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function AreaHealthContent() {
  const { t } = useLocale();
  const { snapshot, loading, error } = useAreaHealth();

  if (loading) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title={t.areaHealth} subtitle={t.loading} backHref={ROUTES.dashboard} />
        <Skeleton className="mx-auto mb-6 h-40 w-40 rounded-full" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title={t.areaHealth}
        subtitle={t.areaHealthSubtitle}
        backHref={ROUTES.dashboard}
      />

      {error && (
        <Card padding="sm" className="mb-4 border-amber-200 bg-amber-50">
          <p className="flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        </Card>
      )}

      <Card className="mb-6 text-center" padding="lg">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t.areaSafetyScore}</h2>
        <ScoreRing score={snapshot.overallScore} />
        <Badge variant={riskVariant[snapshot.riskLevel]} className="mt-4">
          {snapshot.reportCount === 0 ? "Limited data" : `${snapshot.riskLevel} Risk`}
        </Badge>
        <p className="mt-3 text-sm text-muted">
          Based on {snapshot.reportCount} verified incident and infrastructure{" "}
          {snapshot.reportCount === 1 ? "report" : "reports"}.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
          {[
            { label: "Active reports", value: snapshot.activeReportCount },
            { label: "Reported sectors", value: snapshot.sectors.length },
            {
              label: "Last report",
              value: snapshot.updatedAt
                ? snapshot.updatedAt.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })
                : "—",
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Safety by Sector</h2>
        {snapshot.sectors.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted">
              No verified reports are available yet. Sector scores will appear as reports are
              published.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {snapshot.sectors.map((sector) => (
              <Card key={sector.key} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{sector.sector}</p>
                      <p className="text-xs text-muted">{sector.city}</p>
                      <p className="mt-1 text-xs text-muted">
                        {sector.incidentCount} incidents · {sector.infrastructureReportCount}{" "}
                        infrastructure reports
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold text-foreground">{sector.score}</p>
                    <Badge variant={riskVariant[sector.riskLevel]}>
                      {sector.riskLevel} Risk
                    </Badge>
                  </div>
                </div>
                <div className="mt-3">
                  <ScoreBar score={sector.score} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Report Breakdown</h2>
        <div className="flex flex-col gap-3">
          {snapshot.metrics.map((metric) => {
            const Icon = iconMap[metric.icon] ?? Activity;
            return (
              <Card key={metric.label} padding="sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{metric.label}</p>
                      <span className="text-sm font-semibold text-foreground">
                        {metric.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {metric.reportCount} {metric.reportCount === 1 ? "report" : "reports"}
                    </p>
                    <p className="mt-1 text-xs text-muted">{metric.description}</p>
                    <div className="mt-3">
                      <ScoreBar score={metric.score} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card padding="sm" className="mt-6 bg-primary-light/30">
        <p className="text-xs text-muted">
          Scores update from verified Firestore reports. Open, severe, recent, and
          higher-risk report types have more impact; resolved reports have less impact.
        </p>
      </Card>
    </PageContainer>
  );
}
