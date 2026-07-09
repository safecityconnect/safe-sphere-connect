"use client";

import {
  Activity,
  Droplets,
  Shield,
  TrendingDown,
  TrendingUp,
  TreePine,
  Wind,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { ROUTES } from "@/lib/constants";
import { HEALTH_METRICS, HEALTH_TREND, LIVE_LOCATION } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  wind: Wind,
  droplets: Droplets,
  tree: TreePine,
  activity: Activity,
  wrench: Wrench,
};

const OVERALL_SCORE = 78;

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

function TrendChart() {
  const max = Math.max(...HEALTH_TREND.map((t) => t.score));

  return (
    <div className="flex items-end justify-between gap-2 pt-2" style={{ height: 120 }}>
      {HEALTH_TREND.map((point) => (
        <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-primary to-accent transition-all"
            style={{ height: `${(point.score / max) * 100}%`, minHeight: 8 }}
          />
          <span className="text-[10px] text-muted">{point.month}</span>
        </div>
      ))}
    </div>
  );
}

export function AreaHealthContent() {
  const { t } = useLocale();
  const isLoading = useSimulatedLoading();

  if (isLoading) {
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

      <Card className="mb-6 text-center" padding="lg">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t.areaSafetyScore}</h2>
        <ScoreRing score={OVERALL_SCORE} />
        <Badge variant="success" className="mt-4">
          {t.aboveAverage}
        </Badge>
        <p className="mt-3 text-sm text-muted">{t.areaImproved}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
          {[
            { label: t.areaRank, value: "#8" },
            { label: t.nationalAvg, value: "74" },
            { label: t.coveredAreas, value: "7" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-6" padding="md">
        <h2 className="mb-1 text-sm font-semibold text-foreground">6-Month Trend</h2>
        <p className="mb-2 text-xs text-muted">Overall area health score — {LIVE_LOCATION.area}</p>
        <TrendChart />
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Category Breakdown</h2>
        <div className="flex flex-col gap-3">
          {HEALTH_METRICS.map((metric) => {
            const Icon = iconMap[metric.icon] ?? Activity;
            const isPositive = metric.trend > 0;
            const isNegative = metric.trend < 0;

            return (
              <Card key={metric.label} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{metric.label}</p>
                      <p className="text-xs text-muted">{metric.score}/100</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{metric.description}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-0.5 text-xs font-semibold",
                      isPositive && "text-accent",
                      isNegative && "text-danger",
                      !isPositive && !isNegative && "text-muted"
                    )}
                  >
                    {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
                    {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
                    {metric.trend > 0 ? `+${metric.trend}` : metric.trend < 0 ? metric.trend : "—"}
                  </span>
                </div>
                <div className="mt-3">
                  <ScoreBar score={metric.score} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card padding="sm" className="mt-6 bg-primary-light/30">
        <p className="text-xs text-muted">
          Scores are calculated from citizen reports, municipal data, and public safety records across your area. Updated weekly.
        </p>
      </Card>
    </PageContainer>
  );
}
