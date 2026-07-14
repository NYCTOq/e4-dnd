import { beforeEach, describe, expect, it } from "vitest";
import { loadCampaigns } from "./campaignStorage";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  get length() { return this.values.size; }
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true });
});

describe("campaignStorage migration", () => {
  it("fills missing modern fields without discarding old data", () => {
    localStorage.setItem("e4_dnd_campaigns_v1", JSON.stringify([{
      id: "campaign-1", name: "Old Campaign", description: "legacy", characterIds: ["c1"],
      sessionNotes: [], npcNotes: [], quests: [], createdAt: "2025-01-01", updatedAt: "2025-01-01",
    }]));

    const [campaign] = loadCampaigns();
    expect(campaign.name).toBe("Old Campaign");
    expect(campaign.encounters).toEqual([]);
    expect(campaign.timelineEntries).toEqual([]);
    expect(campaign.timelineEnabled).toBe(false);
    expect(campaign.encounterTools).toEqual({ difficulty: false, loot: false, conditions: false, combatRolls: false });
  });
});
