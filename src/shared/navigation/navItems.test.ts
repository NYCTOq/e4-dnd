import { describe, expect, it } from "vitest";
import { getMobileQuickItems, getNavGroupForPath, navGroups, navItems } from "./navItems";

describe("grouped application navigation", () => {
  it("keeps every route in exactly one visible group", () => {
    expect(navGroups).toHaveLength(6);
    expect(new Set(navItems.map((item) => item.to)).size).toBe(navItems.length);
    expect(navItems.every((item) => navGroups.includes(item.group))).toBe(true);
  });

  it("limits the mobile bar to four quick routes so the fifth slot can open the full menu", () => {
    expect(getMobileQuickItems().map((item) => item.to)).toEqual(["/", "/play-mode", "/characters", "/dice"]);
  });

  it("opens the group that owns the current route", () => {
    expect(getNavGroupForPath("/combat")).toBe("Kampanya");
    expect(getNavGroupForPath("/homebrew-lab")).toBe("Homebrew");
    expect(getNavGroupForPath("/unknown")).toBe("Oyuncu");
  });
});
