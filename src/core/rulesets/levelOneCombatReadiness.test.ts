import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneCombatReadiness } from "./levelOneCombatReadiness";

const data: RulesetData = {
  id: "dnd_2024",
  name: "2024",
  classes: [], subclasses: [], races: [], backgrounds: [], feats: [], monsters: [],
  items: [
    { id: "longsword", name: "Longsword", category: "weapon", cost: "15 gp", weight: 3, description: "", damage: "1d8", damageType: "slashing", weaponCategory: "martial" },
    { id: "chain-mail", name: "Chain Mail", category: "armor", cost: "75 gp", weight: 55, description: "", armorClass: 16, armorType: "heavy" },
  ],
  spells: [
    { id: "fire-bolt", name: "Fire Bolt", level: 0, school: "Evocation", castingTime: "Action", range: "120 feet", components: ["V", "S"], duration: "Instantaneous", concentration: false, ritual: false, classes: ["Wizard"], description: "", effectType: "damage", attackType: "spell-attack", damageDice: "1d10" },
    { id: "light", name: "Light", level: 0, school: "Evocation", castingTime: "Action", range: "Touch", components: ["V", "M"], duration: "1 hour", concentration: false, ritual: false, classes: ["Wizard"], description: "", effectType: "utility" },
  ],
};

function baseDraft() {
  return { ...emptyDraft, ruleset: "dnd_2024" as const, name: "Aster", race: "Human", className: "Fighter", maxHp: 12, currentHp: 12, armorClass: 16 };
}

describe("level one combat readiness", () => {
  it("accepts an equipped weapon that exists in inventory", () => {
    const status = getLevelOneCombatReadiness({ ...baseDraft(), inventory: [{ itemId: "longsword", quantity: 1 }], equippedWeaponIds: ["longsword"] }, data);
    expect(status.ready).toBe(true);
    expect(status.primaryOptions).toContain("Longsword");
  });

  it("accepts an offensive spell as a primary combat option", () => {
    const status = getLevelOneCombatReadiness({ ...baseDraft(), className: "Wizard", knownSpellIds: ["fire-bolt"] }, data);
    expect(status.ready).toBe(true);
    expect(status.primaryOptions).toContain("Fire Bolt");
  });

  it("accepts Monk unarmed combat without an equipped weapon", () => {
    const status = getLevelOneCombatReadiness({ ...baseDraft(), className: "Monk" }, data);
    expect(status.ready).toBe(true);
    expect(status.primaryOptions.join(" ")).toMatch(/Unarmed/);
  });

  it("blocks stale equipped references and flags missing combat options", () => {
    const status = getLevelOneCombatReadiness({ ...baseDraft(), equippedWeaponIds: ["missing"] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/envanterde bulunmuyor/);
    expect(status.notices.join(" ")).toMatch(/saldırı büyüsü/);
  });
});
