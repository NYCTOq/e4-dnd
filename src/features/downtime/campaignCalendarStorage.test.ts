import { describe, expect, it } from "vitest";
import {
  advanceCampaignDays,
  createCampaignCalendar,
  getDowntimeProgress,
  getUpcomingEvents,
  sanitizeCampaignCalendar,
} from "./campaignCalendarStorage";

describe("campaign calendar", () => {
  it("advances the date and downtime progress", () => {
    const calendar = createCampaignCalendar("campaign-1");
    calendar.activities.push({
      id: "activity-1",
      title: "Craft potion",
      characterId: "character-1",
      durationDays: 4,
      completedDays: 1,
      status: "active",
      notes: "",
    });
    const next = advanceCampaignDays(calendar, 3);
    expect(next.currentDay).toBe(4);
    expect(next.activities[0]).toMatchObject({ completedDays: 4, status: "completed" });
  });

  it("sorts upcoming events and ignores past entries", () => {
    const calendar = createCampaignCalendar("campaign-1");
    calendar.currentDay = 5;
    calendar.events = [
      { id: "late", title: "Late", day: 9, type: "other", notes: "" },
      { id: "past", title: "Past", day: 2, type: "other", notes: "" },
      { id: "soon", title: "Soon", day: 6, type: "other", notes: "" },
    ];
    expect(getUpcomingEvents(calendar).map((event) => event.id)).toEqual(["soon", "late"]);
  });

  it("sanitizes malformed saved data and calculates progress", () => {
    const calendar = sanitizeCampaignCalendar({
      campaignId: "campaign-1",
      currentDay: -20,
      activities: [{ id: "a", title: "Study", durationDays: 0, completedDays: 20 }],
      events: [{ id: "e", title: "Festival", day: 0, type: "unknown" }],
    });
    expect(calendar?.currentDay).toBe(1);
    expect(calendar?.events[0]).toMatchObject({ day: 1, type: "other" });
    expect(calendar?.activities[0]).toMatchObject({ durationDays: 1, completedDays: 1, status: "completed" });
    expect(getDowntimeProgress(calendar!.activities[0])).toBe(100);
  });
});
