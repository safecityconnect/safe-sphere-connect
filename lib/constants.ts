import {
  Activity,
  HeartPulse,
  LayoutDashboard,
  Map,
  MapPin,
  Shield,
  ShieldCheck,
  User,
  Wrench,
  Siren,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const APP_NAME = "SafeCity Connect";
export const TAGLINE = "Report. Protect. Respond.";
export const REGION = "India";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  safetyMap: "/dashboard/safety-map",
  fixMyCity: "/dashboard/fix-my-city",
  guardianMode: "/dashboard/guardian-mode",
  safeWalk: "/dashboard/safe-walk",
  areaHealth: "/dashboard/area-health",
  profile: "/dashboard/profile",
  reportIncident: "/dashboard/report-incident",
  communityFeed: "/dashboard/community-feed",
  admin: "/admin",
  family: "/dashboard/family",
  accountSettings: "/dashboard/account-settings",
  notifications: "/dashboard/notifications",
  help: "/dashboard/help",
} as const;

/** Guardian live-tracking view for a specific Safe Walk session. */
export function safeWalkTrackRoute(walkId: string): string {
  return `/dashboard/safe-walk/track/${walkId}`;
}

export type NavItem = {
  label: string;
  labelKey?: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
};

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", labelKey: "dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Map", labelKey: "safetyMap", href: ROUTES.safetyMap, icon: Map },
  { label: "Guardian", labelKey: "guardianMode", href: ROUTES.guardianMode, icon: ShieldCheck, highlight: true },
  { label: "Area Health", labelKey: "areaHealth", href: ROUTES.areaHealth, icon: HeartPulse },
  { label: "Profile", labelKey: "profile", href: ROUTES.profile, icon: User },
];

export type DashboardCardItem = {
  title: string;
  titleKey?: string;
  description: string;
  descKey?: string;
  href: string;
  icon: LucideIcon;
  color: "blue" | "teal" | "red" | "green" | "purple" | "slate";
};

export const DASHBOARD_CARDS: DashboardCardItem[] = [
  {
    title: "Safety Map",
    titleKey: "safetyMap",
    description: "View incidents and safe zones across Indian cities",
    descKey: "safetyMapSubtitle",
    href: ROUTES.safetyMap,
    icon: MapPin,
    color: "blue",
  },
  {
    title: "Fix My City",
    titleKey: "fixMyCity",
    description: "Report potholes, garbage, and civic issues",
    descKey: "fixMyCitySubtitle",
    href: ROUTES.fixMyCity,
    icon: Wrench,
    color: "teal",
  },
  {
    title: "Guardian Mode",
    titleKey: "guardianMode",
    description: "Share your live location with trusted guardians",
    descKey: "guardianModeSubtitle",
    href: ROUTES.guardianMode,
    icon: ShieldCheck,
    color: "blue",
  },
  {
    title: "Safe Walk Guardian",
    titleKey: "safeWalk",
    description: "Safe routes, women helpline, and night safety alerts",
    descKey: "safeWalkSubtitle",
    href: ROUTES.safeWalk,
    icon: Shield,
    color: "green",
  },
  {
    title: "Area Health",
    titleKey: "areaHealth",
    description: "See your area's safety and wellness index",
    descKey: "areaHealthSubtitle",
    href: ROUTES.areaHealth,
    icon: Activity,
    color: "purple",
  },
  {
    title: "Profile",
    titleKey: "profile",
    description: "Manage account, language, and preferences",
    descKey: "profileSubtitle",
    href: ROUTES.profile,
    icon: User,
    color: "slate",
  },
  {
    title: "Report Incident",
    description: "Report crimes, suspicious activity, and safety threats",
    href: ROUTES.reportIncident,
    icon: Siren,
    color: "red",
  },
  {
    title: "Community Feed",
    description: "Browse all incidents reported by the community",
    href: ROUTES.communityFeed,
    icon: Users,
    color: "teal",
  },
];
