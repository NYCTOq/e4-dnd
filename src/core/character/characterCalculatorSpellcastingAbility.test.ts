import { describe, expect, it } from "vitest";
import type { AbilityKey, Character } from "./character.types";
import {
  getCharacterSpellcastingAbility,
  getSpellAttackBonus,
  getSpellSaveDc,
} from "./characterCalculator";

function character(className: string): Character {
  return {
    className,
    level: 11,
    abilities: { str: 10, dex: 10, con: 10, int: 20, wis: 8, cha: 18 },
  } as Character;
}

describe("spellcasting ability inference", () => {
  const cases: Array<[string, AbilityKey]> = [
    ["Wizard", "int"],
    ["Sorcerer", "cha"],
    ["Bard", "cha"],
    ["Warlock", "cha"],
    ["Paladin", "cha"],
    ["Cleric", "wis"],
    ["Druid", "wis"],
    ["Ranger", "wis"],
  ];

  it.each(cases)("%s resolves to %s", (className, ability) => {
    expect(getCharacterSpellcastingAbility(character(className))).toBe(ability);
  });

  it("uses INT for Wizard when ability is omitted", () => {
    const wizard = character("Wizard");
    expect(getSpellSaveDc(wizard)).toBe(17);
    expect(getSpellAttackBonus(wizard)).toBe(9);
  });

  it("uses CHA for Paladin when ability is omitted", () => {
    const paladin = character("Paladin");
    expect(getSpellSaveDc(paladin)).toBe(16);
    expect(getSpellAttackBonus(paladin)).toBe(8);
  });

  it("keeps explicit overrides", () => {
    const wizard = character("Wizard");
    expect(getSpellSaveDc(wizard, "cha")).toBe(16);
    expect(getSpellAttackBonus(wizard, "cha")).toBe(8);
  });

  it("keeps WIS fallback for unknown classes", () => {
    const homebrew = character("Chronomancer");
    expect(getCharacterSpellcastingAbility(homebrew)).toBe("wis");
    expect(getSpellSaveDc(homebrew)).toBe(11);
  });
});
