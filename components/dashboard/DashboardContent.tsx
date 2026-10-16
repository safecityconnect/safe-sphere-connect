"use client";

import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronRight, Shield } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { NotificationBell } from "@/components/features/notifications/NotificationBell";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLocale } from "@/components/providers/LocaleProvider";
import { DASHBOARD_CARDS, ROUTES } from "@/lib/constants";
import { auth } from "@/lib/firebase";
import { useAreaHealth } from "@/hooks/useAreaHealth";
import { useEffect, useState } from "react";

export function DashboardContent() {
  const [userEmail, setUserEmail] = useState("");
  const { snapshot: areaHealth, loading: areaHealthLoading } = useAreaHealth();

  useEffect(
    () => onAuthStateChanged(auth, (user) => setUserEmail(user?.email ?? "")),
    []
  );
  const { t } = useLocale();

  return (
    <PageContainer withBottomNav>
      <header className="relative mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{t.goodMorning}</p>
          <p className="text-xs text-muted">{userEmail}</p>
          <h1 className="text-2xl font-bold text-foreground">{t.dashboard}</h1>
          <p className="mt-0.5 text-xs text-muted">{t.tagline}</p>
        </div>
        <NotificationBell />
      </header>

      <Link href={ROUTES.areaHealth} className="mb-6 block">
        <Card
          className="border-primary/20 bg-gradient-to-br from-primary to-primary-dark text-white transition-transform active:scale-[0.99]"
          padding="md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{t.areaHealth}</p>
              <p className="mt-1 text-3xl font-bold">
                {areaHealthLoading ? "—" : areaHealth.overallScore}
                <span className="text-lg font-normal text-white/70">/100</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="bg-white/20 text-white">
                {areaHealth.reportCount === 0
                  ? "Limited data"
                  : `${areaHealth.riskLevel} risk`}
              </Badge>
              <ChevronRight className="h-5 w-5 text-white/60" />
            </div>
          </div>
          <p className="mt-3 text-sm text-white/70">
            {areaHealth.reportCount === 0
              ? "Area Health will update as verified reports become available."
              : `Calculated from ${areaHealth.reportCount} verified incident and infrastructure ${
                  areaHealth.reportCount === 1 ? "report" : "reports"
                } across ${areaHealth.sectors.length} ${
                  areaHealth.sectors.length === 1 ? "sector" : "sectors"
                }.`}
          </p>
        </Card>
      </Link>

      <Card padding="sm" className="mb-6 border-pink-200 bg-pink-50/30">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-pink-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t.womenSafety}</p>
            <p className="text-xs text-muted">
              {t.safeRoutes}, {t.womenHelpline}
            </p>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          {t.quickAccess}
        </h2>
        <div className="grid gap-3">
          {DASHBOARD_CARDS.map((card) => (
            <DashboardCard
              key={card.href}
              item={{
                ...card,
                title: card.titleKey
                  ? t[card.titleKey as keyof typeof t] ?? card.title
                  : card.title,
                description: card.descKey
                  ? t[card.descKey as keyof typeof t] ?? card.description
                  : card.description,
              }}
            />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
