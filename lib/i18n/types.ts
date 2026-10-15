export type Locale = "en" | "hi" | "pa" | "ta" | "bn";

export type TranslationKeys = {
  appName: string;
  tagline: string;
  language: string;
  selectLanguage: string;
  goodMorning: string;
  dashboard: string;
  quickAccess: string;
  areaHealth: string;
  areaHealthSubtitle: string;
  areaSafetyScore: string;
  good: string;
  safetyMap: string;
  safetyMapSubtitle: string;
  fixMyCity: string;
  fixMyCitySubtitle: string;
  guardianMode: string;
  guardianModeSubtitle: string;
  safeWalk: string;
  safeWalkSubtitle: string;
  profile: string;
  profileSubtitle: string;
  nearbyActivity: string;
  centerOnMe: string;
  layers: string;
  mapLegend: string;
  incidents: string;
  safeZones: string;
  hazards: string;
  police: string;
  verified: string;
  holdToAlert: string;
  keepHolding: string;
  guardianModeActive: string;
  locationShared: string;
  call112: string;
  call112Desc: string;
  emergencyServices: string;
  guardians: string;
  liveLocation: string;
  medicalInfo: string;
  shareLocation: string;
  notifyContacts: string;
  audioRecording: string;
  startRecording: string;
  stopRecording: string;
  recordingActive: string;
  eventLog: string;
  noEvents: string;
  womenHelpline: string;
  safeRoutes: string;
  nearbyPolice: string;
  nightSafetyAlerts: string;
  call1091: string;
  readyToWalk: string;
  startSafeWalk: string;
  walkInProgress: string;
  paused: string;
  headingTo: string;
  yourGuardians: string;
  destination: string;
  change: string;
  newReport: string;
  myReports: string;
  submitReport: string;
  communityPlatform: string;
  joinThousands: string;
  everythingYouNeed: string;
  createAccount: string;
  exploreDashboard: string;
  loading: string;
  close: string;
  manage: string;
  primary: string;
  showAll: string;
  noActivity: string;
  noActivityDesc: string;
  womenSafety: string;
  activateGuardianMode: string;
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  pa: "ਪੰਜਾਬੀ",
  ta: "தமிழ்",
  bn: "বাংলা",
};

export const LOCALES: Locale[] = ["en", "hi", "pa", "ta", "bn"];
