import { describe, expect, it } from "vitest";
import { getFeatUseState, getItemChargeState, recoverFeatUses, spendFeatUse, summarizeRecoveredCharges } from "./featItemRuntimeCompletion";
import type { DndItemData } from "./ruleset.types";

const action = { id: "fey-touched", name: "Fey Touched", type: "bonus-action" as const, maxUses: 1, summary: "Misty Step" };
const item = { id: "wand", name: "Wand", category: "gear", rarity: "rare", description: "", weight: 1, cost: "1 gp", charges: 7, chargeCost: 1, requiresAttunement: true } satisfies DndItemData;

describe("v5.133 feat and item runtime completion", () => {
  it("tracks and spends limited feat uses", () => {
    expect(getFeatUseState(action, {}).remaining).toBe(1);
    expect(spendFeatUse(action, {})[action.id]).toBe(1);
  });
  it("recovers limited feat actions only on long rest", () => {
    expect(recoverFeatUses("short", { [action.id]: 1 })).toEqual({ [action.id]: 1 });
    expect(recoverFeatUses("long", { [action.id]: 1 })).toEqual({});
  });
  it("explains attunement and charge blockers", () => {
    expect(getItemChargeState(item, { itemId: item.id, quantity: 1 })?.reason).toContain("attunement");
    expect(getItemChargeState(item, { itemId: item.id, quantity: 1, attuned: true, chargesUsed: 7 })?.remaining).toBe(0);
  });
  it("summarizes recovered magic item charges", () => {
    expect(summarizeRecoveredCharges([{ itemId: item.id, quantity: 1, chargesUsed: 5 }], [{ itemId: item.id, quantity: 1, chargesUsed: 2 }], [item])).toEqual(["Wand +3 charge"]);
  });
});
