import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneEquipmentReadiness } from "./levelOneEquipmentReadiness";

const data: RulesetData = {
  id: "dnd_2024", name: "2024", subclasses: [], races: [], backgrounds: [], feats: [], spells: [], monsters: [],
  classes: [{ id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrows: ["str", "con"], spellcastingAbility: null, armorProficiencies: ["Light", "Medium", "Heavy", "Shields"], weaponProficiencies: ["Simple", "Martial"], skillChoices: { choose: 2, from: [] }, description: "", subclassLevel: 3, spellProgression: "none", levels: [] }],
  items: [
    { id: "longsword", name: "Longsword", category: "weapon", cost: "15 gp", weight: 3, description: "", damage: "1d8", damageType: "slashing", weaponCategory: "martial" },
    { id: "longbow", name: "Longbow", category: "weapon", cost: "50 gp", weight: 2, description: "", damage: "1d8", damageType: "piercing", weaponCategory: "martial", properties: ["Ammunition", "Heavy", "Two-Handed"], range: "150/600" },
    { id: "arrows", name: "Arrows (20)", category: "ammunition", cost: "1 gp", weight: 1, description: "" },
    { id: "plate", name: "Plate", category: "armor", cost: "1500 gp", weight: 65, description: "", armorClass: 18, armorType: "heavy", strengthRequirement: 15 },
  ],
};

function draft() {
  return { ...emptyDraft, ruleset: "dnd_2024" as const, className: "Fighter", abilities: { ...emptyDraft.abilities, str: 16 } };
}

describe("level one equipment readiness", () => {
  it("accepts a legal equipped melee loadout", () => {
    const status = getLevelOneEquipmentReadiness({ ...draft(), inventory: [{ itemId: "longsword", quantity: 1 }], equippedWeaponIds: ["longsword"] }, data);
    expect(status.ready).toBe(true);
    expect(status.summary.join(" ")).toMatch(/Longsword/);
  });

  it("accepts starting gold but leaves a shopping notice", () => {
    const status = getLevelOneEquipmentReadiness({ ...draft(), gold: 100 }, data);
    expect(status.ready).toBe(true);
    expect(status.notices.join(" ")).toMatch(/alışveriş/);
  });

  it("blocks an ammunition weapon without matching ammunition", () => {
    const status = getLevelOneEquipmentReadiness({ ...draft(), inventory: [{ itemId: "longbow", quantity: 1 }], equippedWeaponIds: ["longbow"] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Mühimmat/);
  });

  it("blocks stale slots and unmet armor strength", () => {
    const stale = getLevelOneEquipmentReadiness({ ...draft(), inventory: [{ itemId: "longsword", quantity: 1 }], equippedShieldId: "missing" }, data);
    expect(stale.ready).toBe(false);
    const weak = getLevelOneEquipmentReadiness({ ...draft(), abilities: { ...draft().abilities, str: 10 }, inventory: [{ itemId: "plate", quantity: 1 }], equippedArmorId: "plate" }, data);
    expect(weak.blockers.join(" ")).toMatch(/STR 15/);
  });
});
