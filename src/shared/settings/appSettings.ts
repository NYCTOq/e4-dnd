export type AccentTheme = "violet" | "blue" | "emerald" | "amber";
export type UiDensity = "comfortable" | "compact";
export type MotionPreference = "system" | "full" | "reduced";
export type FontScale = "small" | "normal" | "large";
export type CampaignToolProfile = "simple" | "balanced" | "full";

export type AppSettings = {
  accentTheme: AccentTheme;
  density: UiDensity;
  motion: MotionPreference;
  fontScale: FontScale;
  startRoute: string;
  campaignToolProfile: CampaignToolProfile;
};

export const APP_SETTINGS_STORAGE_KEY = "e4_dnd_app_settings_v1";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  accentTheme: "violet",
  density: "comfortable",
  motion: "system",
  fontScale: "normal",
  startRoute: "/",
  campaignToolProfile: "simple",
};

export const START_ROUTE_OPTIONS = [
  { value: "/", label: "Dashboard" },
  { value: "/play-mode", label: "Play Mode" },
  { value: "/characters", label: "Karakterler" },
  { value: "/campaigns", label: "Campaigns" },
  { value: "/dice", label: "Zar" },
] as const;

export function sanitizeAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_APP_SETTINGS;
  }

  const candidate = value as Partial<AppSettings>;
  const validStartRoutes = START_ROUTE_OPTIONS.map((item) => item.value);

  return {
    accentTheme: ["violet", "blue", "emerald", "amber"].includes(
      candidate.accentTheme ?? "",
    )
      ? (candidate.accentTheme as AccentTheme)
      : DEFAULT_APP_SETTINGS.accentTheme,
    density: ["comfortable", "compact"].includes(candidate.density ?? "")
      ? (candidate.density as UiDensity)
      : DEFAULT_APP_SETTINGS.density,
    motion: ["system", "full", "reduced"].includes(candidate.motion ?? "")
      ? (candidate.motion as MotionPreference)
      : DEFAULT_APP_SETTINGS.motion,
    fontScale: ["small", "normal", "large"].includes(candidate.fontScale ?? "")
      ? (candidate.fontScale as FontScale)
      : DEFAULT_APP_SETTINGS.fontScale,
    startRoute: validStartRoutes.includes(
      candidate.startRoute as (typeof validStartRoutes)[number],
    )
      ? (candidate.startRoute as string)
      : DEFAULT_APP_SETTINGS.startRoute,
    campaignToolProfile: ["simple", "balanced", "full"].includes(
      candidate.campaignToolProfile ?? "",
    )
      ? (candidate.campaignToolProfile as CampaignToolProfile)
      : DEFAULT_APP_SETTINGS.campaignToolProfile,
  };
}

