import { describe, expect, it } from "vitest";
import type { Character } from "./character.types";
import {
  getSpellAttackBonusForSpell,
  getSpellSaveDcForSpell,
  getSpellcastingAbilityForSpell,
} from "./characterCalculator";

const character = {
  className: "Wizard",
  level: 11,
  abilities: { str: 10, dex: 10, con: 10, int: 20, wis: 16, cha: 18 },
  spellSources: {
    "magic-missile": "Wizard",
    bless: "Cleric",
    "eldritch-blast": "Warlock",
  },
} as Character;

describe("N-MEGA14 multiclass spell source ability", () => {
  it("uses INT for Wizard sourced spells", () => {
    expect(getSpellcastingAbilityForSpell(character, "magic-missile")).toBe("int");
    expect(getSpellSaveDcForSpell(character, "magic-missile")).toBe(17);
  });

  it("uses WIS for Cleric sourced spells", () => {
    expect(getSpellcastingAbilityForSpell(character, "bless")).toBe("wis");
    expect(getSpellSaveDcForSpell(character, "bless")).toBe(15);
  });

  it("uses CHA for Warlock sourced spells", () => {
    expect(getSpellcastingAbilityForSpell(character, "eldritch-blast")).toBe("cha");
    expect(getSpellAttackBonusForSpell(character, "eldritch-blast")).toBe(8);
  });

  it("falls back to the primary class when source metadata is missing", () => {
    expect(getSpellcastingAbilityForSpell(character, "unknown")).toBe("int");
  });
});
