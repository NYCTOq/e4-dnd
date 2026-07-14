import { describe, expect, it, vi } from "vitest";
import { createFactionRecord, removeFactionAndRelations, sanitizeFactionRecord } from "./factionStorage";

vi.stubGlobal("crypto", { randomUUID: () => "faction-id" });

describe("faction storage", () => {
  it("creates a valid default faction", () => {
    expect(createFactionRecord("Baroque Works", "campaign-1")).toMatchObject({
      id: "faction-id", name: "Baroque Works", campaignId: "campaign-1", kind: "Diğer",
    });
  });

  it("sanitizes duplicate members and tags", () => {
    const faction = sanitizeFactionRecord({ id: "a", name: "Lonca", memberNpcIds: ["npc-1", "npc-1"], tags: ["gizli", "gizli", ""] });
    expect(faction?.memberNpcIds).toEqual(["npc-1"]);
    expect(faction?.tags).toEqual(["gizli"]);
  });

  it("removes a faction and inbound relations", () => {
    const first = { ...createFactionRecord("A"), id: "a", relations: [{ id: "r", targetFactionId: "b", standing: "Düşman" as const, notes: "" }] };
    const second = { ...createFactionRecord("B"), id: "b" };
    expect(removeFactionAndRelations([first, second], "b")).toEqual([{ ...first, relations: [] }]);
  });
});
