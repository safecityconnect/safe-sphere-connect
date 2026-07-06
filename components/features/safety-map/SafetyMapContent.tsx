"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  Layers,
  MapPin,
  Navigation,
  Shield,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ROUTES } from "@/lib/constants";
import {
  DEFAULT_CITY,
  INDIAN_CITIES,
  MAP_FILTERS,
  POLICE_STATIONS,
  type IncidentSeverity,
  type IndianCity,
  type MapMarkerType,
} from "@/lib/sample-data";
import { listPublicVerifiedIncidents } from "@/lib/incidents";
import { incidentsToMarkers } from "@/lib/map/incident-to-marker";
import type { LatLng } from "@/lib/map/city-centers";
import type { Incident } from "@/lib/types/incident";
import { MapCanvas } from "./MapCanvas";
import { cn } from "@/lib/utils";

const severityVariant: Record<IncidentSeverity, "danger" | "warning" | "success"> = {
  high: "danger",
  medium: "warning",
  low: "success",
};

const categoryIcon: Record<MapMarkerType, typeof AlertTriangle> = {
  incident: AlertTriangle,
  "safe-zone": Shield,
  hazard: MapPin,
  "police-station": Building2,
};

// ── Adapter: Firestore Incident → local display shape ──────────────────────

type MapDisplayIncident = {
  id: string;
  type: string;
  category: MapMarkerType;
  city: string;
  location: string;
  distance: string;
  time: string;
  severity: IncidentSeverity;
  verified: boolean;
  description: string;
};

const VALID_MARKER_TYPES = new Set<string>(["incident", "safe-zone", "hazard", "police-station"]);

function toMarkerType(raw: string): MapMarkerType {
  return VALID_MARKER_TYPES.has(raw) ? (raw as MapMarkerType) : "incident";
}

function formatRelativeTime(ts: Incident["createdAt"]): string {
  if (!ts) return "—";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function toDisplayIncident(incident: Incident): MapDisplayIncident {
  return {
    id: incident.id,
    type: incident.title,
    category: toMarkerType(incident.markerType),
    city: incident.city,
    location: incident.locationText || incident.location || "—",
    distance: "—",
    time: formatRelativeTime(incident.createdAt),
    severity: (incident.severity as IncidentSeverity) ?? "medium",
    verified: incident.verificationStatus === "verified",
    description: incident.description,
  };
}

// ── Component ───────────────────────────────────────────────────────────────

export function SafetyMapContent() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<(typeof MAP_FILTERS)[number]["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [city, setCity] = useState<IndianCity>(DEFAULT_CITY);
  const [centerTarget, setCenterTarget] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await listPublicVerifiedIncidents();
      setIncidents(raw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const cityFilters = useMemo(
    () => INDIAN_CITIES.map((c) => ({ id: c, label: c })),
    []
  );

  const mapFilters = useMemo(
    () =>
      MAP_FILTERS.map((f) => ({
        ...f,
        label:
          f.id === "incident"
            ? t.incidents
            : f.id === "safe-zone"
              ? t.safeZones
              : f.id === "hazard"
                ? t.hazards
                : f.id === "police-station"
                  ? t.police
                  : f.label,
      })),
    [t]
  );

  const displayIncidents = useMemo(
    () => incidents.map(toDisplayIncident),
    [incidents]
  );

  const filtered = useMemo(() => {
    let items = displayIncidents.filter((i) => i.city === city);
    if (filter !== "all") {
      items = items.filter((i) => i.category === filter);
    }
    return items;
  }, [displayIncidents, filter, city]);

  const mapMarkers = useMemo(() => {
    let items = incidents.filter((i) => i.city === city);
    if (filter !== "all") {
      items = items.filter((i) => toMarkerType(i.markerType) === filter);
    }
    return incidentsToMarkers(items);
  }, [incidents, filter, city]);

  const activeSelectedId = useMemo(() => {
    if (!selectedId) return null;
    return filtered.some((i) => i.id === selectedId) ? selectedId : null;
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!activeSelectedId) return;
    const el = listItemRefs.current.get(activeSelectedId);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeSelectedId]);

  const handleCenterOnMe = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Location is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenterTarget({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocationError(
          "Could not get your location. Please allow location access in your browser."
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const nearbyPolice = useMemo(
    () => POLICE_STATIONS.filter((s) => s.city === city),
    [city]
  );

  const selected = filtered.find((i) => i.id === activeSelectedId) ?? null;

  if (loading) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title={t.safetyMap} subtitle={t.loading} backHref={ROUTES.dashboard} />
        <Skeleton className="mb-4 h-56 rounded-2xl sm:h-72" />
        <div className="mb-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <ListSkeleton count={4} />
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title={t.safetyMap}
        subtitle={t.safetyMapSubtitle}
        backHref={ROUTES.dashboard}
        action={
          <Button variant="ghost" size="sm" className="!px-2" aria-label="Filter options">
            <Filter className="h-4 w-4" />
          </Button>
        }
      />

      <FilterChips
        options={cityFilters}
        value={city}
        onChange={(c) => {
          setCity(c as IndianCity);
          setSelectedId(null);
        }}
        className="mb-4"
      />

      <Card padding="none" className="mb-4 overflow-hidden">
        <MapCanvas
          markers={mapMarkers}
          selectedId={activeSelectedId}
          city={city}
          centerTarget={centerTarget}
          onSelect={setSelectedId}
        />
        <div className="flex gap-2 border-t border-border p-3">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={handleCenterOnMe}
          >
            <Navigation className="h-4 w-4" />
            {t.centerOnMe}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setShowLayers(!showLayers)}
          >
            <Layers className="h-4 w-4" />
            {t.layers}
          </Button>
        </div>
      </Card>

      {showLayers && (
        <Card padding="sm" className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {t.mapLegend}
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> {t.incidents}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {t.safeZones}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> {t.hazards}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> {t.police}
            </span>
          </div>
        </Card>
      )}

      <FilterChips
        options={mapFilters}
        value={filter}
        onChange={setFilter}
        className="mb-4"
      />

      {locationError && (
        <p className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">
          {locationError}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger">{error}</p>
      )}

      {selected && (
        <Card padding="sm" className="mb-4 border-primary/30 bg-primary-light/30">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{selected.type}</p>
              <p className="text-sm text-muted">{selected.location}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs text-muted hover:text-foreground"
            >
              {t.close}
            </button>
          </div>
          <p className="mt-2 text-sm text-foreground/80">{selected.description}</p>
        </Card>
      )}

      {nearbyPolice.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t.nearbyPolice}</h2>
          <div className="flex flex-col gap-2">
            {nearbyPolice.map((station) => (
              <Card key={station.id} padding="sm" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{station.name}</p>
                    <p className="text-xs text-muted">{station.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-primary">{station.distance}</p>
                  <Button variant="outline" size="sm" href="tel:100" className="mt-1 !px-2">
                    {station.phone}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {t.nearbyActivity}
            <span className="ml-1.5 font-normal text-muted">({filtered.length})</span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t.noActivity}
            description={t.noActivityDesc}
            actionLabel={t.showAll}
            onAction={() => setFilter("all")}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((incident) => {
              const Icon = categoryIcon[incident.category];
              return (
                <div
                  key={incident.id}
                  ref={(el) => {
                    if (el) listItemRefs.current.set(incident.id, el);
                    else listItemRefs.current.delete(incident.id);
                  }}
                >
                  <Card
                    padding="sm"
                    className={cn(
                      "cursor-pointer transition-colors hover:border-primary/30",
                      activeSelectedId === incident.id && "border-primary/40 bg-primary-light/20"
                    )}
                    onClick={() => setSelectedId(incident.id)}
                  >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        incident.category === "incident" && "bg-red-50 text-red-600",
                        incident.category === "safe-zone" && "bg-emerald-50 text-emerald-600",
                        incident.category === "hazard" && "bg-amber-50 text-amber-600",
                        incident.category === "police-station" && "bg-blue-50 text-blue-600"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{incident.type}</p>
                        <Badge variant={severityVariant[incident.severity]}>
                          {incident.severity}
                        </Badge>
                        {incident.verified && (
                          <Badge variant="success" className="gap-0.5">
                            <CheckCircle className="h-3 w-3" />
                            {t.verified}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted">{incident.location}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-muted">
                        {incident.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-primary">{incident.distance}</p>
                      <p className="text-xs text-muted">{incident.time}</p>
                    </div>
                  </div>
                </Card>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
