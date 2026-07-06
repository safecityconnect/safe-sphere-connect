"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, FileText, Plus } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/constants";
import { auth, db } from "@/lib/firebase";

const INCIDENT_CATEGORIES = [
  "Theft / Snatching",
  "Harassment",
  "Suspicious Activity",
  "Vandalism",
  "Accident",
  "Fight / Assault",
  "Other",
] as const;

type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

type FormState = {
  title: string;
  description: string;
  category: IncidentCategory;
  location: string;
  city: string;
};

const initialForm: FormState = {
  title: "",
  description: "",
  category: INCIDENT_CATEGORIES[0],
  location: "",
  city: "",
};

function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  if (!navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 }
    );
  });
}

export function ReportIncidentContent() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setSubmitError("You must be signed in to report an incident.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const coords = await getCurrentCoordinates();

      await addDoc(collection(db, "incidents"), {
        title: form.title,
        description: form.description,
        // legacy fields (backward compat)
        category: form.category,
        location: form.location,
        // approved schema fields
        incidentCategory: form.category,
        locationText: form.location,
        city: form.city,
        ...(coords
          ? { latitude: coords.latitude, longitude: coords.longitude }
          : {}),
        severity: "medium",
        markerType: "incident",
        verificationStatus: "pending",
        visibility: "pending",
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "open",
      });
      setSubmitSuccess(true);
      setForm(initialForm);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title="Report Incident"
        subtitle="Help keep your community safe"
        backHref={ROUTES.dashboard}
      />

      <Card className="mb-4" padding="md">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">New Incident Report</h3>
            <p className="text-xs text-muted">Your identity is not shared with other citizens</p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Incident Title"
            placeholder="e.g. Phone snatching near Sector 17"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as IncidentCategory })
              }
              disabled={isSubmitting}
              required
            >
              {INCIDENT_CATEGORIES.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <Input
            label="Location"
            placeholder="Sector, landmark, or street address"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
            disabled={isSubmitting}
          />

          <Input
            label="City"
            placeholder="e.g. Chandigarh"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              className="min-h-[100px] w-full resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              placeholder="Describe what happened with as much detail as possible…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          {submitError && (
            <p className="rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
              {submitError}
            </p>
          )}

          {submitSuccess && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              Incident reported successfully. Thank you for keeping your community safe!
            </p>
          )}

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? (
              "Submitting…"
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </form>
      </Card>

      <Card padding="sm" className="border-primary/20 bg-primary-light/30">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">What happens next?</p>
            <p className="mt-1 text-xs text-muted">
              Your report is reviewed by our moderation team and forwarded to local authorities.
              Every submission helps improve the safety data for your city.
            </p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
