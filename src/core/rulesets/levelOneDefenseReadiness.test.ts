import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneDefenseReadiness } from "./levelOneDefenseReadiness";

const data: RulesetData = {
  id: "dnd_2024", name: "2024", subclasses: [], races: [], backgrounds: [], feats: [], spells: [], monsters: [],
  classes: [{ id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrows: ["str", "con"], spellcastingAbility: null, armorProficiencies: ["Light", "Medium", "Heavy", "Shields"], weaponProficiencies: ["Simple", "Martial"], skillChoices: { choose: 2, from: [] }, description: "", subclassLevel: 3, spellProgression: "none", levels: [] }],
  items: [
    { id: "chain-mail", name: "Chain Mail", category: "armor", cost: "75 gp", weight: 55, description: "", armorClass: 16, armorType: "heavy" },
    { id: "shield", name: "Shield", category: "shield", cost: "10 gp", weight: 6, description: "", armorClassBonus: 2 },
    { id: "greatsword", name: "Greatsword", category: "weapon", cost: "50 gp", weight: 6, description: "", damage: "2d6", damageType: "slashing", weaponCategory: "martial", properties: ["Heavy", "Two-Handed"] },
  ],
};

function draft() {
  return {
    ...emptyDraft,
    ruleset: "dnd_2024" as const,
    className: "Fighter",
    abilities: { ...emptyDraft.abilities, con: 14 },
    maxHp: 12,
    armorClassMode: "auto" as const,
    hitDice: [{ die: 10, max: 1, used: 0 }],
  };
}

describe("level one defense readiness", () => {
  it("accepts a valid level one fighter defense profile", () => {
    const status = getLevelOneDefenseReadiness({ ...draft(), inventory: [{ itemId: "chain-mail", quantity: 1 }], equippedArmorId: "chain-mail" }, data);
    expect(status.ready).toBe(true);
    expect(status.summary.join(" ")).toMatch(/AC 16/);
  });

  it("blocks max hp below hit die plus constitution modifier", () => {
    const status = getLevelOneDefenseReadiness({ ...draft(), maxHp: 10 }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/en az 12/);
  });

  it("blocks an invalid hit die pool", () => {
    const status = getLevelOneDefenseReadiness({ ...draft(), hitDice: [{ die: 8, max: 1, used: 0 }] }, data);
    expect(status.blockers.join(" ")).toMatch(/1d10/);
  });

  it("blocks shield and two-handed weapon conflict", () => {
    const status = getLevelOneDefenseReadiness({
      ...draft(),
      inventory: [{ itemId: "shield", quantity: 1 }, { itemId: "greatsword", quantity: 1 }],
      equippedShieldId: "shield",
      equippedWeaponIds: ["greatsword"],
    }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/aynı anda kullanılamaz/);
  });
});
