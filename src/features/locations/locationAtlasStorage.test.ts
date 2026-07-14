import { describe, expect, it, vi } from "vitest";
import { createWorldLocation, getLocationDepth, removeLocationAndDetach, sanitizeWorldLocation } from "./locationAtlasStorage";

vi.stubGlobal("crypto", { randomUUID: () => "location-id" });

describe("location atlas storage", () => {
  it("creates a valid default location", () => {
    expect(createWorldLocation("Alubarna", "campaign-1")).toMatchObject({ id: "location-id", name: "Alubarna", campaignId: "campaign-1", kind: "Diğer" });
  });

  it("sanitizes duplicate tags and npc links", () => {
    const location = sanitizeWorldLocation({ id: "a", name: "Saray", tags: ["saray", "saray", ""], linkedNpcIds: ["npc-1", "npc-1"] });
    expect(location?.tags).toEqual(["saray"]);
    expect(location?.linkedNpcIds).toEqual(["npc-1"]);
  });

  it("calculates hierarchy depth and detaches children on delete", () => {
    const root = { ...createWorldLocation("Kök"), id: "root" };
    const child = { ...createWorldLocation("Çocuk"), id: "child", parentId: "root" };
    const grandchild = { ...createWorldLocation("Alt"), id: "grand", parentId: "child" };
    expect(getLocationDepth([root, child, grandchild], "grand")).toBe(2);
    expect(removeLocationAndDetach([root, child], "root")).toEqual([{ ...child, parentId: "" }]);
  });
});
