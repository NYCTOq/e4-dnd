import { describe, expect, it } from "vitest";
import type { AbilityScores, CharacterClassLevel } from "../character/character.types";
import type { DndClassData } from "./ruleset.types";
import {
  getCombinedCasterLevel,
  getMulticlassAttacksPerAction,
  getMulticlassConflictSummary,
  getMulticlassEligibility,
  getMulticlassProficiencyGains,
  getMulticlassSpellSlots,
  getMulticlassTransitionEligibility,
} from "./multiclassRules";

const klass = (name: string, spellProgression: DndClassData["spellProgression"]): DndClassData => ({
  id: name.toLowerCase(), name, hitDie: 8, primaryAbilities: [], savingThrows: [], spellcastingAbility: null,
  armorProficiencies: [], weaponProficiencies: [], skillChoices: { choose: 0, from: [] }, description: "",
  subclassLevel: 3, spellProgression, levels: [],
});

const abilities = (patch: Partial<AbilityScores> = {}): AbilityScores => ({
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...patch,
});

describe("official multiclass certification", () => {
  it("treats the Fighter prerequisite as STR 13 or DEX 13", () => {
    expect(getMulticlassEligibility("Fighter", abilities({ dex: 13 })).eligible).toBe(true);
    expect(getMulticlassEligibility("Fighter", abilities({ str: 13 })).eligible).toBe(true);
    expect(getMulticlassEligibility("Fighter", abilities()).missing).toEqual(["STR veya DEX 13"]);
  });

  it("requires prerequisites for both the current and the new class", () => {
    const levels: CharacterClassLevel[] = [{ className: "Paladin", level: 3 }];
    expect(getMulticlassTransitionEligibility(levels, "Sorcerer", abilities({ cha: 13, str: 12 }))).toMatchObject({
      eligible: false,
      missing: ["Paladin: STR 13"],
    });
    expect(getMulticlassTransitionEligibility(levels, "Sorcerer", abilities({ cha: 13, str: 13 })).eligible).toBe(true);
    expect(getMulticlassTransitionEligibility(levels, "Paladin", abilities()).eligible).toBe(true);
  });

  it("uses edition-aware half-caster rounding", () => {
    const classes = [klass("Paladin", "half"), klass("Sorcerer", "full")];
    const levels = [{ className: "Paladin", level: 1 }, { className: "Sorcerer", level: 1 }];
    expect(getCombinedCasterLevel(levels, classes, "dnd_2014")).toBe(1);
    expect(getCombinedCasterLevel(levels, classes, "dnd_2024")).toBe(2);
    expect(getMulticlassSpellSlots(levels, classes, [], "dnd_2014")[0].max).toBe(2);
    expect(getMulticlassSpellSlots(levels, classes, [], "dnd_2024")[0].max).toBe(3);
  });

  it("counts Eldritch Knight and Arcane Trickster as third casters only when selected", () => {
    const classes = [klass("Fighter", "none"), klass("Rogue", "none"), klass("Wizard", "full")];
    expect(getCombinedCasterLevel([
      { className: "Fighter", level: 6, subclass: "Eldritch Knight" },
      { className: "Rogue", level: 3, subclass: "Arcane Trickster" },
      { className: "Wizard", level: 1 },
    ], classes, "dnd_2014")).toBe(4);
    expect(getCombinedCasterLevel([
      { className: "Fighter", level: 6, subclass: "Champion" },
      { className: "Rogue", level: 3, subclass: "Thief" },
      { className: "Wizard", level: 1 },
    ], classes, "dnd_2014")).toBe(1);
  });

  it("does not stack Extra Attack and reports alternative AC conflicts", () => {
    const levels = [
      { className: "Fighter", level: 11 },
      { className: "Barbarian", level: 5 },
      { className: "Monk", level: 5 },
    ];
    expect(getMulticlassAttacksPerAction(levels)).toBe(3);
    expect(getMulticlassConflictSummary(levels)).toEqual([
      "Extra Attack kaynakları birleşmez; yalnız en yüksek saldırı sayısı kullanılır.",
      "Unarmored Defense formülleri birleşmez; tek bir AC hesaplama yöntemi seçilir.",
    ]);
  });

  it("returns limited multiclass proficiency gains without saving throws", () => {
    expect(getMulticlassProficiencyGains("Fighter", "dnd_2014")).toContain("Medium armor");
    expect(getMulticlassProficiencyGains("Fighter", "dnd_2024")).not.toContain("Saving throws");
    expect(getMulticlassProficiencyGains("Sorcerer", "dnd_2024")).toEqual([]);
  });
});
