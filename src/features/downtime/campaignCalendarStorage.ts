export type CalendarEventType = "session" | "travel" | "deadline" | "festival" | "combat" | "other";
export type DowntimeStatus = "planned" | "active" | "completed";

export type CampaignCalendarEvent = {
  id: string;
  title: string;
  day: number;
  type: CalendarEventType;
  notes: string;
};

export type DowntimeActivity = {
  id: string;
  title: string;
  characterId: string;
  durationDays: number;
  completedDays: number;
  status: DowntimeStatus;
  notes: string;
};

export type CampaignCalendar = {
  campaignId: string;
  currentDay: number;
  dayLabel: string;
  events: CampaignCalendarEvent[];
  activities: DowntimeActivity[];
  updatedAt: string;
};

const STORAGE_KEY = "e4_dnd_campaign_calendars_v1";

function safeInteger(value: unknown, fallback: number, minimum = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(minimum, Math.floor(value))
    : fallback;
}

function sanitizeEvent(value: unknown): CampaignCalendarEvent | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CampaignCalendarEvent>;
  if (typeof item.id !== "string" || typeof item.title !== "string") return null;
  const validTypes: CalendarEventType[] = ["session", "travel", "deadline", "festival", "combat", "other"];
  return {
    id: item.id,
    title: item.title,
    day: safeInteger(item.day, 1, 1),
    type: validTypes.includes(item.type as CalendarEventType) ? (item.type as CalendarEventType) : "other",
    notes: typeof item.notes === "string" ? item.notes : "",
  };
}

function sanitizeActivity(value: unknown): DowntimeActivity | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<DowntimeActivity>;
  if (typeof item.id !== "string" || typeof item.title !== "string") return null;
  const durationDays = safeInteger(item.durationDays, 1, 1);
  const completedDays = Math.min(durationDays, safeInteger(item.completedDays, 0));
  const validStatuses: DowntimeStatus[] = ["planned", "active", "completed"];
  return {
    id: item.id,
    title: item.title,
    characterId: typeof item.characterId === "string" ? item.characterId : "",
    durationDays,
    completedDays,
    status: completedDays >= durationDays
      ? "completed"
      : validStatuses.includes(item.status as DowntimeStatus)
        ? (item.status as DowntimeStatus)
        : "planned",
    notes: typeof item.notes === "string" ? item.notes : "",
  };
}

export function createCampaignCalendar(campaignId: string): CampaignCalendar {
  return {
    campaignId,
    currentDay: 1,
    dayLabel: "Gün",
    events: [],
    activities: [],
    updatedAt: new Date().toISOString(),
  };
}

export function sanitizeCampaignCalendar(value: unknown): CampaignCalendar | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CampaignCalendar>;
  if (typeof item.campaignId !== "string" || !item.campaignId) return null;
  return {
    campaignId: item.campaignId,
    currentDay: safeInteger(item.currentDay, 1, 1),
    dayLabel: typeof item.dayLabel === "string" && item.dayLabel.trim() ? item.dayLabel : "Gün",
    events: Array.isArray(item.events) ? item.events.map(sanitizeEvent).filter((event): event is CampaignCalendarEvent => Boolean(event)) : [],
    activities: Array.isArray(item.activities) ? item.activities.map(sanitizeActivity).filter((activity): activity is DowntimeActivity => Boolean(activity)) : [],
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
  };
}

export function loadCampaignCalendars(): CampaignCalendar[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.map(sanitizeCampaignCalendar).filter((calendar): calendar is CampaignCalendar => Boolean(calendar))
      : [];
  } catch {
    return [];
  }
}

export function saveCampaignCalendars(calendars: CampaignCalendar[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calendars));
  } catch {
    // Storage unavailable. The current session remains usable.
  }
}

export function advanceCampaignDays(calendar: CampaignCalendar, days: number): CampaignCalendar {
  const step = Math.max(0, Math.floor(days));
  if (!step) return calendar;
  const activities = calendar.activities.map((activity) => {
    if (activity.status === "completed") return activity;
    const completedDays = Math.min(activity.durationDays, activity.completedDays + step);
    return {
      ...activity,
      completedDays,
      status: completedDays >= activity.durationDays ? "completed" as const : "active" as const,
    };
  });
  return {
    ...calendar,
    currentDay: calendar.currentDay + step,
    activities,
    updatedAt: new Date().toISOString(),
  };
}

export function getUpcomingEvents(calendar: CampaignCalendar, limit = 5) {
  return [...calendar.events]
    .filter((event) => event.day >= calendar.currentDay)
    .sort((a, b) => a.day - b.day || a.title.localeCompare(b.title, "tr"))
    .slice(0, limit);
}

export function getDowntimeProgress(activity: DowntimeActivity) {
  return Math.round((activity.completedDays / Math.max(1, activity.durationDays)) * 100);
}
