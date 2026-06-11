"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";

type Preferences = {
  pushNotifications: boolean;
  locationSharing: boolean;
  incidentAlerts: boolean;
  reportUpdates: boolean;
  communityActivity: boolean;
  safetyAlerts: boolean;
};

const defaults: Preferences = {
  pushNotifications: true,
  locationSharing: true,
  incidentAlerts: true,
  reportUpdates: true,
  communityActivity: false,
  safetyAlerts: true,
};

function Toggle({
  enabled,
  onChange,
  label,
  disabled,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        enabled ? "bg-primary" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          enabled && "translate-x-5"
        )}
      />
    </button>
  );
}

type ToggleRow = {
  key: keyof Preferences;
  label: string;
  description: string;
};

const SECTIONS: { heading: string; rows: ToggleRow[] }[] = [
  {
    heading: "General",
    rows: [
      { key: "pushNotifications", label: "Push Notifications", description: "Receive alerts on your device" },
      { key: "locationSharing", label: "Location Sharing", description: "Enable for map and Safe Walk features" },
    ],
  },
  {
    heading: "Activity",
    rows: [
      { key: "incidentAlerts", label: "Incident Alerts", description: "New incidents reported near you" },
      { key: "reportUpdates", label: "Report Status Updates", description: "When your report is reviewed or resolved" },
      { key: "communityActivity", label: "Community Activity", description: "New posts and comments in community feed" },
    ],
  },
  {
    heading: "Safety",
    rows: [
      { key: "safetyAlerts", label: "Safety Alerts", description: "Night safety notices and emergency broadcasts" },
    ],
  },
];

export function NotificationsContent() {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Preferences | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const stored = data.preferences ?? {};
        setPrefs((prev) => ({ ...prev, ...stored }));
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = async (key: keyof Preferences) => {
    const newValue = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: newValue }));
    const user = auth.currentUser;
    if (!user) return;
    setSavingKey(key);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        [`preferences.${key}`]: newValue,
      });
    } catch {
      setPrefs((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title="Notifications" subtitle="Loading…" backHref={ROUTES.profile} />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title="Notifications"
        subtitle="Choose which alerts you receive"
        backHref={ROUTES.profile}
      />

      <div className="flex flex-col gap-5">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {section.heading}
            </h2>
            <Card padding="none" className="overflow-hidden">
              {section.rows.map((row, index) => (
                <div
                  key={row.key}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5",
                    index < section.rows.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-sm font-medium text-foreground">{row.label}</p>
                    <p className="text-xs text-muted">{row.description}</p>
                  </div>
                  <Toggle
                    enabled={prefs[row.key]}
                    onChange={() => handleToggle(row.key)}
                    label={row.label}
                    disabled={savingKey === row.key}
                  />
                </div>
              ))}
            </Card>
          </section>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Push notification delivery depends on your device and browser permissions.
      </p>
    </PageContainer>
  );
}
