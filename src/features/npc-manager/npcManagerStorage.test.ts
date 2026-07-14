import { describe, expect, it, vi } from "vitest";
import { createNpcRecord, getNpcRelationshipCount, sanitizeNpcRecord } from "./npcManagerStorage";

describe("npc manager storage", () => {
  it("creates a blank npc record", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "npc-1" });
    const npc = createNpcRecord("Cobra", "campaign-1");
    expect(npc.id).toBe("npc-1");
    expect(npc.campaignId).toBe("campaign-1");
    expect(npc.disposition).toBe("Tarafsız");
  });

  it("sanitizes imported npc data", () => {
    const npc = sanitizeNpcRecord({ id: "1", name: "Vivi", disposition: "unknown" });
    expect(npc?.name).toBe("Vivi");
    expect(npc?.disposition).toBe("Tarafsız");
    expect(npc?.relationships).toEqual([]);
  });

  it("counts direct and incoming relationships", () => {
    const first = { ...createNpcRecord("A"), id: "a", relationships: [{ id: "r1", targetNpcId: "b", label: "Müttefik" }] };
    const second = { ...createNpcRecord("B"), id: "b", relationships: [] };
    expect(getNpcRelationshipCount([first, second], "b")).toBe(1);
  });
});
