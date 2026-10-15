export type IncidentSeverity = "high" | "medium" | "low";
export type MapMarkerType = "incident" | "safe-zone" | "hazard" | "police-station";

export type IndianCity =
  | "Chandigarh"
  | "Mohali"
  | "Panchkula"
  | "Delhi"
  | "Mumbai"
  | "Bengaluru"
  | "Hyderabad";

export const INDIAN_CITIES: IndianCity[] = [
  "Chandigarh",
  "Mohali",
  "Panchkula",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
];

export type MapIncident = {
  id: string;
  type: string;
  category: MapMarkerType;
  city: IndianCity;
  location: string;
  distance: string;
  time: string;
  severity: IncidentSeverity;
  verified: boolean;
  description: string;
  x: number;
  y: number;
};

export type GuardianContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
};

export type Guardian = {
  id: string;
  name: string;
  status: "Available" | "Offline" | "Watching";
  phone: string;
};

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  neighborhood: string;
  city: IndianCity;
  avatarInitials: string;
  stats: {
    reportsFiled: number;
    safeWalks: number;
    incidentsReported: number;
    communityPoints: number;
  };
};

export type PoliceStation = {
  id: string;
  name: string;
  city: IndianCity;
  address: string;
  distance: string;
  phone: string;
};

export type SafeRoute = {
  id: string;
  title: string;
  from: string;
  to: string;
  city: IndianCity;
  distance: string;
  duration: string;
  safetyScore: number;
  description: string;
};

export type NightSafetyAlert = {
  id: string;
  title: string;
  message: string;
  city: IndianCity;
  severity: "high" | "medium" | "low";
  activeAfter: string;
};

export type GuardianModeEventType =
  | "guardian_mode_activated"
  | "location_shared"
  | "contact_notified"
  | "audio_recorded"
  | "call_initiated";

export type GuardianModeEvent = {
  id: string;
  type: GuardianModeEventType;
  timestamp: string;
  detail: string;
};

export const DEFAULT_CITY: IndianCity = "Chandigarh";

export const LIVE_LOCATION = {
  city: "Chandigarh" as IndianCity,
  area: "Sector 22, Chandigarh",
  accuracy: "45 m",
  coordinates: { lat: 30.7333, lng: 76.7794 },
};

export const MAP_INCIDENTS: MapIncident[] = [
  {
    id: "1",
    type: "Snatching Report",
    category: "incident",
    city: "Chandigarh",
    location: "Sector 17 Plaza, Chandigarh",
    distance: "0.4 km",
    time: "18 min ago",
    severity: "high",
    verified: true,
    description: "Multiple reports of phone snatching near the market entrance.",
    x: 28,
    y: 35,
  },
  {
    id: "2",
    type: "Pothole Cluster",
    category: "hazard",
    city: "Mohali",
    location: "Phase 7, Mohali",
    distance: "1.2 km",
    time: "1 hr ago",
    severity: "medium",
    verified: true,
    description: "Deep potholes on main road causing two-wheeler accidents.",
    x: 62,
    y: 48,
  },
  {
    id: "3",
    type: "Well-Lit Safe Zone",
    category: "safe-zone",
    city: "Chandigarh",
    location: "Rock Garden, Chandigarh",
    distance: "0.8 km",
    time: "Verified",
    severity: "low",
    verified: true,
    description: "24/7 CCTV coverage and regular police patrols.",
    x: 45,
    y: 22,
  },
  {
    id: "4",
    type: "Suspicious Activity",
    category: "incident",
    city: "Panchkula",
    location: "Sector 5 Market, Panchkula",
    distance: "2.1 km",
    time: "45 min ago",
    severity: "medium",
    verified: false,
    description: "Unverified report of individuals following pedestrians at night.",
    x: 75,
    y: 65,
  },
  {
    id: "5",
    type: "Women Safety Booth",
    category: "safe-zone",
    city: "Delhi",
    location: "Connaught Place, New Delhi",
    distance: "0.5 km",
    time: "Verified",
    severity: "low",
    verified: true,
    description: "Delhi Police women safety booth with emergency call facility.",
    x: 18,
    y: 72,
  },
  {
    id: "6",
    type: "Waterlogged Road",
    category: "hazard",
    city: "Mumbai",
    location: "Andheri West, Mumbai",
    distance: "3.4 km",
    time: "2 hrs ago",
    severity: "medium",
    verified: true,
    description: "Standing water after monsoon rains. Use caution when crossing.",
    x: 55,
    y: 80,
  },
  {
    id: "7",
    type: "Police Station",
    category: "police-station",
    city: "Chandigarh",
    location: "Sector 17 Police Station",
    distance: "0.6 km",
    time: "Open 24/7",
    severity: "low",
    verified: true,
    description: "Chandigarh Police — women help desk available.",
    x: 35,
    y: 40,
  },
  {
    id: "8",
    type: "Traffic Congestion",
    category: "hazard",
    city: "Bengaluru",
    location: "MG Road, Bengaluru",
    distance: "5.2 km",
    time: "30 min ago",
    severity: "low",
    verified: true,
    description: "Heavy traffic due to metro construction. Expect delays.",
    x: 82,
    y: 30,
  },
  {
    id: "9",
    type: "Open Manhole",
    category: "hazard",
    city: "Hyderabad",
    location: "Banjara Hills, Hyderabad",
    distance: "4.8 km",
    time: "3 hrs ago",
    severity: "high",
    verified: true,
    description: "Uncovered manhole on footpath. Reported to GHMC.",
    x: 40,
    y: 55,
  },
  {
    id: "10",
    type: "Police Station",
    category: "police-station",
    city: "Mohali",
    location: "Phase 3B2 Police Post",
    distance: "1.5 km",
    time: "Open 24/7",
    severity: "low",
    verified: true,
    description: "Mohali Police — SHE Team available on request.",
    x: 68,
    y: 58,
  },
];

export const GUARDIAN_MODE_CONTACTS: GuardianContact[] = [
  {
    id: "1",
    name: "Sunita Sharma",
    relationship: "Mother",
    phone: "+91 98765 43210",
    isPrimary: true,
  },
  {
    id: "2",
    name: "Rahul Verma",
    relationship: "Brother",
    phone: "+91 98123 45678",
    isPrimary: true,
  },
  {
    id: "3",
    name: "Anita Kapoor",
    relationship: "Friend",
    phone: "+91 99887 76655",
    isPrimary: false,
  },
];

export const GUARDIANS: Guardian[] = [
  {
    id: "1",
    name: "Priya Singh",
    status: "Available",
    phone: "+91 98760 11223",
  },
  {
    id: "2",
    name: "Rahul Verma",
    status: "Watching",
    phone: "+91 98123 45678",
  },
  {
    id: "3",
    name: "Sunita Sharma",
    status: "Offline",
    phone: "+91 98765 43210",
  },
];

export const POLICE_STATIONS: PoliceStation[] = [
  {
    id: "1",
    name: "Sector 17 Police Station",
    city: "Chandigarh",
    address: "Sector 17, Chandigarh 160017",
    distance: "0.6 km",
    phone: "100",
  },
  {
    id: "2",
    name: "Phase 3B2 Police Post",
    city: "Mohali",
    address: "Phase 3B2, SAS Nagar, Mohali",
    distance: "1.5 km",
    phone: "100",
  },
  {
    id: "3",
    name: "Sector 5 Police Station",
    city: "Panchkula",
    address: "Sector 5, Panchkula 134109",
    distance: "2.3 km",
    phone: "100",
  },
  {
    id: "4",
    name: "Connaught Place Police Station",
    city: "Delhi",
    address: "Connaught Place, New Delhi 110001",
    distance: "0.8 km",
    phone: "100",
  },
];

export const SAFE_ROUTES: SafeRoute[] = [
  {
    id: "1",
    title: "Sector 17 to Rock Garden",
    from: "Sector 17 Plaza",
    to: "Rock Garden",
    city: "Chandigarh",
    distance: "1.8 km",
    duration: "22 min",
    safetyScore: 92,
    description: "Well-lit main roads with CCTV and regular police patrols.",
  },
  {
    id: "2",
    title: "Phase 7 to ISBT Mohali",
    from: "Phase 7 Market",
    to: "ISBT Mohali",
    city: "Mohali",
    distance: "3.2 km",
    duration: "38 min",
    safetyScore: 85,
    description: "Busy commercial route with women safety booth en route.",
  },
  {
    id: "3",
    title: "Connaught Place to India Gate",
    from: "Connaught Place",
    to: "India Gate",
    city: "Delhi",
    distance: "4.5 km",
    duration: "55 min",
    safetyScore: 88,
    description: "High-traffic route with Delhi Police patrol every 30 minutes.",
  },
];

export const NIGHT_SAFETY_ALERTS: NightSafetyAlert[] = [
  {
    id: "1",
    title: "Reduced lighting in Sector 22",
    message: "Several streetlights reported non-functional. Use well-lit main roads after 8 PM.",
    city: "Chandigarh",
    severity: "medium",
    activeAfter: "20:00",
  },
  {
    id: "2",
    title: "Women helpline reminder",
    message: "Dial 1091 for 24/7 women safety support. SHE Team available in Chandigarh.",
    city: "Chandigarh",
    severity: "low",
    activeAfter: "18:00",
  },
  {
    id: "3",
    title: "Isolated stretch alert",
    message: "Bandra Reclamation footpath poorly lit. Avoid after 9 PM or walk in groups.",
    city: "Mumbai",
    severity: "high",
    activeAfter: "21:00",
  },
];

export const USER_PROFILE: UserProfile = {
  name: "Priya Sharma",
  email: "priya.sharma@example.in",
  phone: "+91 98765 43210",
  memberSince: "January 2025",
  neighborhood: "Sector 22, Chandigarh",
  city: "Chandigarh",
  avatarInitials: "PS",
  stats: {
    reportsFiled: 14,
    safeWalks: 32,
    incidentsReported: 4,
    communityPoints: 520,
  },
};

export const REPORT_CATEGORIES = [
  "All",
  "Potholes",
  "Garbage",
  "Street Lights",
  "Water Leakage",
  "Open Manholes",
  "Unsafe Areas",
  "Traffic Issues",
] as const;

export const MAP_FILTERS = [
  { id: "all", label: "All" },
  { id: "incident", label: "Incidents" },
  { id: "safe-zone", label: "Safe Zones" },
  { id: "hazard", label: "Hazards" },
  { id: "police-station", label: "Police" },
] as const;
