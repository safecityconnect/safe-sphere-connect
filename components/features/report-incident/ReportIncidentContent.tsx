"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, FileText, MapPin, Plus } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ROUTES } from "@/lib/constants";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_CITY, INDIAN_CITIES } from "@/lib/sample-data";
import { getCityCenter, type LatLng } from "@/lib/map/city-centers";
import { LocationPickerModal } from "./LocationPickerModal";

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

type LocationStatus = "requesting" | "captured" | "unavailable";
type LocationSource = "gps" | "manual" | null;

function resolveInitialMapCenter(cityText: string): LatLng {
  const match = INDIAN_CITIES.find(
    (c) => c.toLowerCase() === cityText.trim().toLowerCase()
  );
  return getCityCenter(match ?? DEFAULT_CITY);
}

export function ReportIncidentContent() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("requesting");
  const [locationSource, setLocationSource] = useState<LocationSource>(null);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationSource("gps");
        setLocationStatus("captured");
      },
      () => {
        setLocationStatus("unavailable");
      },
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 }
    );
  }, []);

  const handleManualLocationConfirm = (picked: LatLng) => {
    setCoords(picked);
    setLocationSource("manual");
    setLocationStatus("captured");
    setShowLocationPicker(false);
  };

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
          ? { latitude: coords.lat, longitude: coords.lng }
          : {}),
        severity: "medium",
        markerType: "incident",
        // Citizen reports always enter the moderation queue.
        safesphereVerified: false,
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
            <label className="text-sm font-medium text-foreground">GPS Location</label>

            {locationStatus === "requesting" && (
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Requesting your current location…
              </p>
            )}

            {locationStatus === "captured" && coords && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  {locationSource === "gps"
                    ? "Current location captured."
                    : "Location selected on map."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Change
                </button>
              </div>
            )}

            {locationStatus === "unavailable" && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted">
                  We couldn&apos;t access your location automatically.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLocationPicker(true)}
                  disabled={isSubmitting}
                >
                  <MapPin className="h-4 w-4" />
                  Select Location on Map
                </Button>
              </div>
            )}
          </div>

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
              Your report will be reviewed by the SafeSphere moderation team. Once verified, it may be published on the Safety Map and Community Feed to help keep the community informed.
            </p>
          </div>
        </div>
      </Card>

      {showLocationPicker && (
        <LocationPickerModal
          initialCenter={coords ?? resolveInitialMapCenter(form.city)}
          onConfirm={handleManualLocationConfirm}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </PageContainer>
  );
}
