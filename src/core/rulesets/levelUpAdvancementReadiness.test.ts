import { describe, expect, it } from "vitest";
import { getLevelUpAdvancementReadiness } from "./levelUpAdvancementReadiness";
import type { Character } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";

const character = {
  id: "c1", name: "A", playerName: "", ruleset: "dnd_2024", race: "Human", className: "Fighter",
  classLevels: [{ className: "Fighter", level: 2 }], subclass: "", background: "Soldier", featIds: [],
  skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [], level: 2,
  abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 }, maxHp: 20, currentHp: 20,
  tempHp: 0, armorClass: 16, armorClassMode: "auto", knownSpellIds: [], preparedSpellIds: [], spellSlots: [],
  inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 0,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [{ die: 10, max: 2, used: 0 }], resources: [],
  exhaustion: 0, conditionDurations: {}, conditions: [], notes: "", createdAt: "", updatedAt: "",
} satisfies Character;

const ruleset = {
  id: "dnd_2024", name: "2024", classes: [{ id: "fighter", name: "Fighter", hitDie: 10,
    primaryAbilities: ["str"], savingThrows: ["str", "con"], armorProficiencies: [], weaponProficiencies: [],
    skillChoices: { choose: 2, from: [] }, description: "", subclassLevel: 3, spellProgression: "none",
    spellcastingAbility: null, levels: [{ level: 3, proficiencyBonus: 2, features: ["Subclass"] }] }],
  subclasses: [{ id: "champion", name: "Champion", className: "Fighter", ruleset: "dnd_2024", selectionLevel: 3, description: "", features: [] }],
  races: [], backgrounds: [], feats: [], spells: [], items: [], monsters: [],
} satisfies RulesetData;

describe("level-up advancement readiness", () => {
  it("requires subclass at the class subclass level", () => {
    const report = getLevelUpAdvancementReadiness({ character, rulesetData: ruleset, targetClassName: "Fighter", milestoneChoiceComplete: true });
    expect(report.ready).toBe(false);
    expect(report.subclassRequired).toBe(true);
  });

  it("accepts a valid subclass selection", () => {
    const report = getLevelUpAdvancementReadiness({ character, rulesetData: ruleset, targetClassName: "Fighter", selectedSubclassName: "Champion", milestoneChoiceComplete: true });
    expect(report.ready).toBe(true);
  });
});
