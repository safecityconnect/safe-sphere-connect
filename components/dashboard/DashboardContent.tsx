"use client";

import Link from "next/link";
import { Bell, ChevronRight, Moon, Shield } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLocale } from "@/components/providers/LocaleProvider";
import { DASHBOARD_CARDS, ROUTES } from "@/lib/constants";
import { NIGHT_SAFETY_ALERTS } from "@/lib/sample-data";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";

export function DashboardContent() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [userEmail, setUserEmail] = useState("");

useEffect(() => {
  const user = auth.currentUser;

  if (user) {
    setUserEmail(user.email || "");
  }
}, []);
  const { t } = useLocale();
  const nightAlert = NIGHT_SAFETY_ALERTS[0];

  return (
    <PageContainer withBottomNav>
      <header className="relative mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{t.goodMorning}</p>
          <p className="text-xs text-muted">{userEmail}</p>
          <h1 className="text-2xl font-bold text-foreground">{t.dashboard}</h1>
          <p className="mt-0.5 text-xs text-muted">{t.tagline}</p>
        </div>
        <button
        type="button"
         onClick={() => setShowNotifications(!showNotifications)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:bg-primary-light hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            3
          </span>
        </button>
        {showNotifications && (
  <div className="absolute right-0 top-16 z-50 w-72 rounded-xl border bg-white shadow-xl p-3">
    <h3 className="mb-3 font-semibold">
      Notifications
    </h3>

    <div className="space-y-3">

      <div className="border-b pb-2">
        <p className="font-medium">
          Welcome to SafeCity
        </p>
        <p className="text-xs text-muted">
          Your account has been created successfully.
        </p>
      </div>

      <div className="border-b pb-2">
        <p className="font-medium">
          Safe Walk Available
        </p>
        <p className="text-xs text-muted">
          Start a monitored walk anytime.
        </p>
      </div>

      <div>
        <p className="font-medium">
          Emergency Contacts
        </p>
        <p className="text-xs text-muted">
          Add trusted contacts in your profile.
        </p>
      </div>

    </div>
  </div>
)}
      </header>

      <Card padding="sm" className="mb-6 border-indigo-200 bg-indigo-50/50">
        <div className="flex items-start gap-3">
          <Moon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t.nightSafetyAlerts}</p>
            <p className="text-xs text-muted">{nightAlert.message}</p>
          </div>
          <Badge variant="warning">After 8 PM</Badge>
        </div>
      </Card>

      <Link href={ROUTES.cityHealth} className="mb-6 block">
        <Card
          className="border-primary/20 bg-gradient-to-br from-primary to-primary-dark text-white transition-transform active:scale-[0.99]"
          padding="md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{t.cityHealthScore}</p>
              <p className="mt-1 text-3xl font-bold">
                78<span className="text-lg font-normal text-white/70">/100</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="bg-white/20 text-white">
                {t.good}
              </Badge>
              <ChevronRight className="h-5 w-5 text-white/60" />
            </div>
          </div>
          <p className="mt-3 text-sm text-white/70">
            Chandigarh safety index improved by 3 points this week.
          </p>
        </Card>
      </Link>

      <Card padding="sm" className="mb-6 border-pink-200 bg-pink-50/30">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-pink-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t.womenSafety}</p>
            <p className="text-xs text-muted">
              {t.safeRoutes}, {t.nearbyPolice}, {t.womenHelpline}
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
