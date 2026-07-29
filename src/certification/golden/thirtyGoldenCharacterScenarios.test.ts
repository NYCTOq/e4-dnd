import { describe, expect, it } from "vitest";
import {
  THIRTY_GOLDEN_CHARACTERS,
  asiOrFeatChoices,
  proficiencyBonus,
  spellcastingKind,
  subclassStartLevel,
} from "./thirtyGoldenCharacterScenarios";

describe("v6.1 thirty golden character oracle", () => {
  it("contains exactly 30 unique scenarios covering both rulesets and every class", () => {
    expect(THIRTY_GOLDEN_CHARACTERS).toHaveLength(30);
    expect(new Set(THIRTY_GOLDEN_CHARACTERS.map((s) => s.id)).size).toBe(30);
    expect(new Set(THIRTY_GOLDEN_CHARACTERS.map((s) => s.ruleset))).toEqual(new Set(["dnd_2014", "dnd_2024"]));
    expect(new Set(THIRTY_GOLDEN_CHARACTERS.map((s) => s.className)).size).toBe(12);
  });

  it("uses official proficiency progression", () => {
    expect([1,4,5,8,9,12,13,16,17,20].map(proficiencyBonus)).toEqual([2,2,3,3,4,4,5,5,6,6]);
  });

  it("uses edition-aware subclass unlock levels", () => {
    expect(subclassStartLevel("dnd_2014", "Cleric")).toBe(1);
    expect(subclassStartLevel("dnd_2014", "Wizard")).toBe(2);
    expect(subclassStartLevel("dnd_2014", "Fighter")).toBe(3);
    expect(subclassStartLevel("dnd_2024", "Cleric")).toBe(3);
    expect(THIRTY_GOLDEN_CHARACTERS.every((s) => s.expected.subclassUnlocked)).toBe(true);
  });

  it("handles fighter and rogue extra ASI/feat levels", () => {
    expect(asiOrFeatChoices("Fighter", 18)).toBe(6);
    expect(asiOrFeatChoices("Rogue", 14)).toBe(4);
    expect(asiOrFeatChoices("Wizard", 20)).toBe(5);
  });

  it("classifies full, half, pact and third casters", () => {
    expect(spellcastingKind("Wizard", "Diviner")).toBe("full");
    expect(spellcastingKind("Paladin", "Oath of Devotion")).toBe("half");
    expect(spellcastingKind("Warlock", "The Fiend")).toBe("pact");
    expect(spellcastingKind("Fighter", "Eldritch Knight")).toBe("third");
    expect(spellcastingKind("Barbarian", "Path of the Zealot")).toBe("none");
  });
});
