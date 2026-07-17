import { describe, expect, it } from "vitest";
import type { DndItemData } from "./ruleset.types";
import { addInventoryEntries, expandPackIntoInventory, getAttunementEligibility, getEquipmentLoadSummary, getItemChargeState, getItemSpellCastingPlan, getWeaponPropertyRuntime } from "./equipmentClosureRuntime";

const item = (value: Partial<DndItemData> & Pick<DndItemData, "id" | "name" | "category">): DndItemData => ({ cost: "", weight: 0, description: "", ...value });

describe("equipment closure runtime", () => {
  it("merges starting equipment without duplicate rows", () => {
    expect(addInventoryEntries([{ itemId: "rope", quantity: 1 }], [{ itemId: "rope", quantity: 2 }, { itemId: "torch", quantity: 10 }])).toEqual([{ itemId: "rope", quantity: 3 }, { itemId: "torch", quantity: 10 }]);
  });
  it("expands packs with quantity multipliers", () => {
    const pack = item({ id: "explorer-pack", name: "Explorer Pack", category: "pack", contents: [{ itemId: "torch", quantity: 10 }, { itemId: "rope", quantity: 1 }] });
    expect(expandPackIntoInventory([], pack, 2)).toEqual([{ itemId: "torch", quantity: 20 }, { itemId: "rope", quantity: 2 }]);
  });
  it("normalizes weapon property combinations", () => {
    const bow = item({ id: "longbow", name: "Longbow", category: "weapon", properties: ["Ammunition", "Heavy", "Two-Handed"], range: "150/600" });
    expect(getWeaponPropertyRuntime(bow)).toMatchObject({ ammunition: true, heavy: true, twoHanded: true, range: "150/600" });
  });
  it("blocks a fourth attuned item", () => {
    const inventory = ["a", "b", "c", "d"].map((itemId, index) => ({ itemId, quantity: 1, attuned: index < 3 }));
    expect(getAttunementEligibility(inventory, item({ id: "d", name: "D", category: "gear", requiresAttunement: true })).allowed).toBe(false);
  });
  it("tracks charge cost and item spell fallback values", () => {
    const wand = item({ id: "wand", name: "Wand", category: "gear", charges: 7, chargeCost: 2, grantedSpellName: "Fireball", itemSaveDc: 15, tags: ["cursed"] });
    expect(getItemChargeState([{ itemId: "wand", quantity: 1, chargesUsed: 6 }], wand)).toMatchObject({ remaining: 1, canUse: false });
    expect(getItemSpellCastingPlan(wand, 13, 5)).toMatchObject({ spellName: "Fireball", saveDc: 15, attackBonus: 5, cursed: true });
  });
  it("reports weight, penalties and remaining capacity together", () => {
    const items = [item({ id: "plate", name: "Plate", category: "armor", weight: 65 })];
    expect(getEquipmentLoadSummary(4, [{ itemId: "plate", quantity: 1 }], items)).toMatchObject({ weight: 65, capacity: 60, remainingCapacity: 0, encumbered: true, speedPenalty: 10 });
  });
});
