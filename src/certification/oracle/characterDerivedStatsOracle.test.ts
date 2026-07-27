import { describe, expect, it } from "vitest";
import type { Character } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { buildCharacterDerivedStatsOracle } from "./characterDerivedStatsOracle";

const data = {
  classes: [{ name: "Wizard", spellcastingAbility: "int", savingThrows: ["int", "wis"] }],
  races: [{ name: "Elf", speed: 30 }],
  backgrounds: [],
  feats: [{ id: "alert", name: "Alert" }, { id: "observant", name: "Observant" }],
  items: [
    { id: "leather", category: "armor", armorClass: 11, armorType: "light" },
    { id: "shield", category: "shield", armorClassBonus: 2 },
    { id: "luck", category: "gear", armorBonus: 1 },
  ],
} as unknown as RulesetData;

const character = {
  className: "Wizard", level: 5, ruleset: "dnd_2014", race: "Elf", background: "",
  featIds: ["alert", "observant"], skillProficiencies: ["Perception", "Arcana"],
  expertiseSkills: ["Arcana"], abilities: { str: 8, dex: 16, con: 14, int: 18, wis: 12, cha: 10 },
  armorClass: 10, armorClassMode: "auto", equippedArmorId: "leather", equippedShieldId: "shield",
  equippedWeaponIds: [], fightingStyleIds: [], inventory: [{ itemId: "luck", quantity: 1, attuned: true }],
} as unknown as Character;

describe("v5.118B character derived stats oracle", () => {
  it("resolves the complete canonical reference snapshot", () => {
    const result = buildCharacterDerivedStatsOracle(character, data);
    expect(result).toMatchObject({
      proficiencyBonus: 3,
      armorClass: 17,
      initiative: 8,
      speed: 30,
      passivePerception: 19,
      spellcastingAbility: "int",
      spellSaveDc: 15,
      spellAttackBonus: 7,
    });
    expect(result.skills.Arcana).toBe(10);
    expect(result.saves.int).toBe(8);
    expect(result.saves.wis).toBe(5);
  });
});
