import type { Incident } from "@/lib/types/incident";
import type { InfrastructureReport } from "@/lib/types/infrastructure-report";
import { infrastructureSeverityForCategory } from "@/lib/types/infrastructure-report";

export type SafetyRiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type AreaHealthReport = {
  id: string;
  source: "incident" | "infrastructure";
  sector: string;
  city: string;
  category: string;
  severity: "low" | "medium" | "high";
  status: string;
  createdAt: Date | null;
  latitude?: number;
  longitude?: number;
};

export type AreaHealthMetric = {
  label: string;
  score: number;
  reportCount: number;
  description: string;
  icon: "shield" | "wrench";
};

export type SectorHealth = {
  key: string;
  sector: string;
  city: string;
  score: number;
  riskLevel: SafetyRiskLevel;
  reportCount: number;
  activeReportCount: number;
  incidentCount: number;
  infrastructureReportCount: number;
  latitude?: number;
  longitude?: number;
};

export type AreaHealthSnapshot = {
  overallScore: number;
  riskLevel: SafetyRiskLevel;
  reportCount: number;
  activeReportCount: number;
  sectors: SectorHealth[];
  metrics: AreaHealthMetric[];
  updatedAt: Date | null;
};

const SEVERITY_PENALTY = {
  low: 3,
  medium: 8,
  high: 15,
} as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function riskLevelForScore(score: number): SafetyRiskLevel {
  if (score >= 80) return "Low";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "High";
  return "Critical";
}

export function extractSector(location: string, city: string): string {
  const match = location.match(/\b(sector|phase)\s*[-:]?\s*([a-z0-9]+(?:[-/][a-z0-9]+)?)/i);
  if (match) {
    const prefix = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    return `${prefix} ${match[2].toUpperCase()}`;
  }

  const neighborhood = location
    .split(",")[0]
    ?.trim()
    .replace(/\s+/g, " ");
  return neighborhood || `${city || "Unknown city"} area`;
}

function dateFrom(value: { toDate: () => Date } | null | undefined): Date | null {
  if (!value) return null;
  try {
    return value.toDate();
  } catch {
    return null;
  }
}

export function normalizeAreaHealthReports(
  incidents: Incident[],
  infrastructureReports: InfrastructureReport[]
): AreaHealthReport[] {
  return [
    ...incidents.map((incident): AreaHealthReport => {
      const location = incident.locationText || incident.location || "";
      return {
        id: incident.id,
        source: "incident",
        sector: extractSector(location, incident.city),
        city: incident.city || "Unknown city",
        category: incident.incidentCategory || incident.category || incident.markerType,
        severity: incident.severity || "medium",
        status: incident.status,
        createdAt: dateFrom(incident.createdAt),
        latitude: incident.latitude,
        longitude: incident.longitude,
      };
    }),
    ...infrastructureReports.map((report): AreaHealthReport => ({
      id: report.id,
      source: "infrastructure",
      sector: extractSector(report.locationText, report.city),
      city: report.city || "Unknown city",
      category: report.category,
      severity: infrastructureSeverityForCategory(report.category),
      status: report.status,
      createdAt: dateFrom(report.createdAt),
      latitude: report.latitude,
      longitude: report.longitude,
    })),
  ];
}

function typeMultiplier(report: AreaHealthReport): number {
  const category = report.category.toLowerCase();
  if (
    /(assault|fight|harass|snatch|theft|suspicious|unsafe|manhole)/.test(category)
  ) {
    return 1.25;
  }
  if (/(accident|vandal|street.?light|pothole|traffic)/.test(category)) return 1.05;
  if (/(garbage|water|leak)/.test(category)) return 0.8;
  return 1;
}

function statusMultiplier(status: string): number {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
  if (normalized === "resolved" || normalized === "closed") return 0.2;
  if (normalized === "in-progress") return 0.6;
  return 1;
}

function recencyMultiplier(createdAt: Date | null, referenceDate: Date): number {
  if (!createdAt) return 0.75;
  const ageDays = Math.max(0, referenceDate.getTime() - createdAt.getTime()) / 86_400_000;
  if (ageDays <= 7) return 1;
  if (ageDays <= 30) return 0.85;
  if (ageDays <= 90) return 0.65;
  return 0.4;
}

function reportPenalty(report: AreaHealthReport, referenceDate: Date): number {
  const sourceMultiplier = report.source === "infrastructure" ? 0.8 : 1;
  return (
    SEVERITY_PENALTY[report.severity] *
    typeMultiplier(report) *
    statusMultiplier(report.status) *
    recencyMultiplier(report.createdAt, referenceDate) *
    sourceMultiplier
  );
}

function scoreReports(reports: AreaHealthReport[], referenceDate: Date): number {
  if (reports.length === 0) return 0;
  const penalty = reports.reduce(
    (total, report) => total + reportPenalty(report, referenceDate),
    0
  );
  return clampScore(100 - penalty);
}

function isActive(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized !== "resolved" && normalized !== "closed";
}

function centroid(reports: AreaHealthReport[]): { latitude?: number; longitude?: number } {
  const located = reports.filter(
    (report) =>
      Number.isFinite(report.latitude) && Number.isFinite(report.longitude)
  );
  if (located.length === 0) return {};
  return {
    latitude:
      located.reduce((sum, report) => sum + (report.latitude ?? 0), 0) / located.length,
    longitude:
      located.reduce((sum, report) => sum + (report.longitude ?? 0), 0) / located.length,
  };
}

export function calculateAreaHealth(
  reports: AreaHealthReport[],
  referenceDate = new Date()
): AreaHealthSnapshot {
  const grouped = new Map<string, AreaHealthReport[]>();
  for (const report of reports) {
    const key = `${report.city.toLowerCase()}::${report.sector.toLowerCase()}`;
    grouped.set(key, [...(grouped.get(key) ?? []), report]);
  }

  const sectors = [...grouped.entries()]
    .map(([key, sectorReports]): SectorHealth => {
      const score = scoreReports(sectorReports, referenceDate);
      return {
        key,
        sector: sectorReports[0].sector,
        city: sectorReports[0].city,
        score,
        riskLevel: riskLevelForScore(score),
        reportCount: sectorReports.length,
        activeReportCount: sectorReports.filter((report) => isActive(report.status)).length,
        incidentCount: sectorReports.filter((report) => report.source === "incident").length,
        infrastructureReportCount: sectorReports.filter(
          (report) => report.source === "infrastructure"
        ).length,
        ...centroid(sectorReports),
      };
    })
    .sort((a, b) => a.score - b.score || a.sector.localeCompare(b.sector));

  const incidents = reports.filter((report) => report.source === "incident");
  const infrastructure = reports.filter((report) => report.source === "infrastructure");
  const overallScore =
    sectors.length > 0
      ? clampScore(
          sectors.reduce((total, sector) => total + sector.score, 0) /
            sectors.length
        )
      : 0;

  return {
    overallScore,
    riskLevel: riskLevelForScore(overallScore),
    reportCount: reports.length,
    activeReportCount: reports.filter((report) => isActive(report.status)).length,
    sectors,
    metrics: [
      {
        label: "Incident Safety",
        score: scoreReports(incidents, referenceDate),
        reportCount: incidents.length,
        description: "Crime and safety incidents weighted by type, severity, status, and recency",
        icon: "shield",
      },
      {
        label: "Infrastructure Safety",
        score: scoreReports(infrastructure, referenceDate),
        reportCount: infrastructure.length,
        description: "Civic hazards weighted by issue type, severity, status, and recency",
        icon: "wrench",
      },
    ],
    updatedAt:
      reports
        .map((report) => report.createdAt)
        .filter((date): date is Date => date !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
  };
}
