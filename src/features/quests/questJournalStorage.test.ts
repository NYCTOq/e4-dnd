import { describe, expect, it } from "vitest";
import { calculateQuestProgress, createQuestRecord, sanitizeQuestRecord } from "./questJournalStorage";
describe("quest journal storage", () => {
  it("creates a safe default quest", () => { const quest = createQuestRecord("Kayıp Harita", "campaign-1"); expect(quest.title).toBe("Kayıp Harita"); expect(quest.campaignId).toBe("campaign-1"); expect(quest.status).toBe("Taslak"); });
  it("sanitizes invalid quest data", () => { const quest = sanitizeQuestRecord({ id: "q1", title: "  ", status: "???", priority: "???", tags: ["ana", "ana", 7] }); expect(quest?.title).toBe("Adsız görev"); expect(quest?.status).toBe("Taslak"); expect(quest?.priority).toBe("Normal"); expect(quest?.tags).toEqual(["ana"]); });
  it("calculates objective progress", () => { expect(calculateQuestProgress({ objectives: [{ id: "1", text: "A", completed: true }, { id: "2", text: "B", completed: false }] })).toBe(50); });
});
