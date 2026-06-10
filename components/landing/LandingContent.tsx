"use client";

import {
  AlertTriangle,
  MapPin,
  Phone,
  Shield,
  Users,
  Wrench,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ROUTES } from "@/lib/constants";
import { INDIAN_EMERGENCY_SERVICES } from "@/lib/emergency-services";
import Link from "next/link";


const featureKeys = [
  {
    icon: MapPin,
    titleKey: "safetyMap" as const,
    descKey: "safetyMapSubtitle" as const,
  },
  {
    icon: Wrench,
    titleKey: "fixMyCity" as const,
    descKey: "fixMyCitySubtitle" as const,
  },
  {
    icon: AlertTriangle,
    titleKey: "sosEmergency" as const,
    descKey: "oneTapSOS" as const,
  },
  {
    icon: Shield,
    titleKey: "safeWalk" as const,
    descKey: "safeWalkSubtitle" as const,
  },
  {
    icon: Users,
    titleKey: "cityHealthScore" as const,
    descKey: "cityHealthScoreSubtitle" as const,
  },
];

export function LandingContent() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-full flex-col">
      <header className="safe-area-top border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <Button href={ROUTES.login} variant="ghost" size="sm">
              Log in
            </Button>
            <Button href={ROUTES.register} size="sm">
              {t.createAccount}
            </Button>
            <Button href="/dashboard/profile" variant="ghost" size="sm">
            <User className="h-4 w-4" />
            Profile
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-emerald-800 px-4 py-16 text-white sm:py-24">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="relative mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Shield className="h-4 w-4" />
              {t.communityPlatform}
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t.appName}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-white/90 sm:text-xl">
              {t.tagline}
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-base text-white/70">
              Empowering citizens across Chandigarh, Delhi, Mumbai, Bengaluru, and more
              to report hazards, protect communities, and respond to emergencies — dial 112 anytime.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                href={ROUTES.register}
                variant="outline"
                size="lg"
                className="min-w-[180px] bg-white text-teal-700 hover:bg-white/90"
              >
                {t.createAccount}
              </Button>
              <Button
                href={ROUTES.dashboard}
                variant="outline"
                size="lg"
                className="min-w-[180px] border-white/40 text-white hover:bg-white/10"
              >
                {t.exploreDashboard}
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-lg font-semibold text-foreground">
              Indian Emergency Helplines
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INDIAN_EMERGENCY_SERVICES.map((service) => (
                <div
                  key={service.number}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/10 font-bold text-danger">
                    {service.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{service.label}</p>
                    <p className="text-xs text-muted line-clamp-1">{service.description}</p>
                  </div>
                  <Phone className="h-4 w-4 shrink-0 text-muted" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t.everythingYouNeed}
              </h2>
              <p className="mt-2 text-muted">
              Women Safety • Emergency Response • Civic Reporting • Community Protection
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {featureKeys.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link
  key={feature.titleKey}
  href={
    feature.titleKey === "safetyMap"
      ? "/dashboard/safety-map"
      : feature.titleKey === "fixMyCity"
      ? "/dashboard/fix-my-city"
      : feature.titleKey === "sosEmergency"
      ? "/dashboard/sos"
      : feature.titleKey === "safeWalk"
      ? "/dashboard/safe-walk"
      : feature.titleKey === "cityHealthScore"
      ? "/dashboard/city-health"
      : "/dashboard"
  }
  className="block rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md hover:scale-[1.02] cursor-pointer"
>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t[feature.titleKey]}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {t[feature.descKey]}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-primary-light px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Users className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
              {t.joinThousands}
            </h2>
            <p className="mt-3 text-muted">
              Be part of a connected community that reports, protects, and responds
              together across India. Dial 112 for emergencies, 1091 for women helpline.
            </p>
            <Button href={ROUTES.register} size="lg" className="mt-8">
              Join SafeCity Connect
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <Logo size="sm" href="/" />
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} SafeCity Connect India. {t.tagline}
          </p>
        </div>
      </footer>
    </div>
  );
}
