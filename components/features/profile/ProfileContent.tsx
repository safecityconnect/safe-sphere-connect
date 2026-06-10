"use client";

import { useState } from "react";
import {
  Award,
  Bell,
  CheckCircle,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  MapPin,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
const menuItems = [
  { label: "Account Settings", icon: Settings, description: "Name, email, password" },
  { label: "Notifications", icon: Bell, description: "Alerts and push preferences" },
  { label: "Privacy & Security", icon: Shield, description: "Data sharing and 2FA" },
  { label: "Help & Support", icon: HelpCircle, description: "FAQs and contact us" },
];

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
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

export function ProfileContent() {
  const { t } = useLocale();
  const router = useRouter();
  const isLoading = useSimulatedLoading();
  const [isEditing, setIsEditing] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    neighborhood: "",
    memberSince: "",
    avatarInitials: "",
    stats: {
      reportsFiled: 0,
      safeWalks: 0,
      incidentsReported: 0,
      communityPoints: 0,
    },
  });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      if (!user) {
        console.log("NO USER");
        setIsProfileLoading(false);
        return;
      }
  
      console.log("USER FOUND:", user.uid);
      console.log("PATH:", "users/" + user.uid);
      console.log("PROJECT:", db.app.options.projectId);
  
      const docRef = doc(
        db,
        "users",
        user.uid
      );
  
      const docSnap = await getDoc(docRef);
  
      console.log("DOCUMENT EXISTS:", docSnap.exists());
      console.log("DATA:", docSnap.data());
  
      if (docSnap.exists()) {
        setProfile((prev) => {
          const data = docSnap.data();
        
          return {
            ...prev,
            ...data,
            avatarInitials: String(data.name || "Citizen")
            .split(" ")
            .map((word: string) => word[0])
            .join("")
            .toUpperCase(),
          };
        });
      }
      setIsProfileLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profile.name,
        city: profile.city,
        phone: profile.phone,
      });
      setProfile((prev) => ({
        ...prev,
        avatarInitials: String(profile.name || "Citizen")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase(),
      }));
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };
  if (isLoading || isProfileLoading) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title={t.profile} subtitle={t.loading} backHref={ROUTES.dashboard} />
        <Skeleton className="mb-6 h-24 rounded-2xl" />
        <div className="mb-6 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomNav>
      <PageHeader title={t.profile} subtitle={t.profileSubtitle} backHref={ROUTES.dashboard} />

      <Card className="mb-6" padding="md">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
            {profile.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="info">Citizen Member</Badge>
              <span className="flex items-center gap-1 text-xs text-muted">
                <MapPin className="h-3 w-3" />
                {profile.neighborhood}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isSaving}
          >
            <User className="h-4 w-4" />
            {isEditing ? (isSaving ? "Saving…" : "Done") : "Edit"}
          </Button>
        </div>
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
          Member since {profile.memberSince}
        </p>
      </Card>

      {isEditing && (
        <Card className="mb-6" padding="md">
          <h3 className="mb-4 font-semibold text-foreground">Edit Profile</h3>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <Input
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={isSaving}
            />
            <Input
              label="City"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              disabled={isSaving}
            />
            <Input
              label="Phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              disabled={isSaving}
            />
            {saveError && (
              <p className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />
                Profile saved successfully!
              </p>
            )}
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </Card>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Your Activity</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Reports Filed", value: profile.stats.reportsFiled, icon: FileText, color: "text-primary" },
            { label: "Safe Walks", value: profile.stats.safeWalks, icon: Shield, color: "text-emerald-600" },
            { label: "Incidents Reported", value: profile.stats.incidentsReported, icon: Users, color: "text-amber-600" },
            { label: "Community Points", value: profile.stats.communityPoints, icon: Award, color: "text-purple-600" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} padding="sm">
                <Icon className={cn("h-5 w-5", stat.color)} />
                <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t.language}</h2>
        <Card padding="md" className="mb-6">
          <LanguageSelector />
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Quick Preferences</h2>
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Push Notifications</p>
              <p className="text-xs text-muted">Incident alerts and report updates</p>
            </div>
            <Toggle
              enabled={pushEnabled}
              onChange={() => setPushEnabled(!pushEnabled)}
              label="Push notifications"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Location Sharing</p>
              <p className="text-xs text-muted">For map and Safe Walk features</p>
            </div>
            <Toggle
              enabled={locationEnabled}
              onChange={() => setLocationEnabled(!locationEnabled)}
              label="Location sharing"
            />
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Settings</h2>
        <Card padding="none" className="overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-primary-light/50",
                  index < menuItems.length - 1 && "border-b border-border"
                )}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{item.label}</span>
                  <span className="block text-xs text-muted">{item.description}</span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
              </button>
            );
          })}
        </Card>
      </section>

      <Button
        onClick={handleLogout}
        variant="outline"
        fullWidth
        className="text-danger border-danger/30 hover:bg-danger-light"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </PageContainer>
  );
}
