"use client";

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/constants";
import { auth, db } from "@/lib/firebase";

type AccountFields = {
  name: string;
  phone: string;
  city: string;
};

const defaultFields: AccountFields = { name: "", phone: "", city: "" };

export function AccountSettingsContent() {
  const [fields, setFields] = useState<AccountFields>(defaultFields);
  const [original, setOriginal] = useState<AccountFields>(defaultFields);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const loaded: AccountFields = {
          name: data.name ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
        };
        setFields(loaded);
        setOriginal(loaded);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isDirty =
    fields.name !== original.name ||
    fields.phone !== original.phone ||
    fields.city !== original.city;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: fields.name,
        phone: fields.phone,
        city: fields.city,
      });
      setOriginal(fields);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title="Account Settings" subtitle="Loading…" backHref={ROUTES.profile} />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title="Account Settings"
        subtitle="Update your name, phone, and city"
        backHref={ROUTES.profile}
      />

      <Card padding="md">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={fields.name}
            onChange={(e) => setFields({ ...fields, name: e.target.value })}
            disabled={isSaving}
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={fields.phone}
            onChange={(e) => setFields({ ...fields, phone: e.target.value })}
            disabled={isSaving}
          />
          <Input
            label="City"
            placeholder="e.g. Delhi, Mumbai, Bengaluru"
            value={fields.city}
            onChange={(e) => setFields({ ...fields, city: e.target.value })}
            disabled={isSaving}
          />

          {saveError && (
            <p className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
              {saveError}
            </p>
          )}

          {saveSuccess && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Account settings saved successfully!
            </p>
          )}

          <Button type="submit" fullWidth disabled={isSaving || !isDirty}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-xs text-muted">
        Your email address cannot be changed here. Contact support for account-level changes.
      </p>
    </PageContainer>
  );
}
