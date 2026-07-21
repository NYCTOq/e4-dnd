import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { getInvocationChoiceCount } from "./invocationRules";
import { getPactMagicSlots } from "./pactMagicRules";
import {
  getMysticArcanumSpellLevels,
  getWarlockCantripCount,
  getWarlockKnownSpellLimit,
  getWarlockPreparedSpellLimit,
  getWarlockSubclassFeatureLevels,
} from "./warlockRules";
import {
  getArcaneRecoveryBudget,
  getWizardCantripCount,
  getWizardPreparedSpellLimit,
  getWizardSpellbookMinimum,
  getWizardSubclassFeatureLevels,
} from "./wizardRules";

const load = <T,>(path: string): T => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8")) as T;
const classData = (edition: "2014" | "2024", className: string) =>
  load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`).find((entry) => entry.name === className)!;
const mergedSubclasses = (edition: "2014" | "2024", className: string) => {
  const base = load<DndSubclassData[]>(`public/data/dnd_${edition}/subclasses.json`);
  const expansion = edition === "2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024;
  return [...base, ...expansion.filter((entry) => !base.some((existing) => existing.id === entry.id))]
    .filter((entry) => entry.className === className && entry.ruleset === `dnd_${edition}`);
};
const featuresAt = (edition: "2014" | "2024", className: string, level: number) =>
  classData(edition, className).levels.find((row) => row.level === level)?.features ?? [];

const expectFeature = (edition: "2014" | "2024", className: string, level: number, feature: string) => {
  expect(featuresAt(edition, className, level), `${edition} ${className} L${level}: ${feature}`).toContain(feature);
};

describe("Warlock and Wizard official progression", () => {
  it("locks 2014 Warlock class feature checkpoints", () => {
    const expected: Record<number, string[]> = {
      1: ["Otherworldly Patron", "Pact Magic"], 2: ["Eldritch Invocations"], 3: ["Pact Boon"],
      4: ["Ability Score Improvement"], 6: ["Otherworldly Patron Feature"], 8: ["Ability Score Improvement"],
      10: ["Otherworldly Patron Feature"], 11: ["Mystic Arcanum (6th)"], 12: ["Ability Score Improvement"],
      13: ["Mystic Arcanum (7th)"], 14: ["Otherworldly Patron Feature"], 15: ["Mystic Arcanum (8th)"],
      16: ["Ability Score Improvement"], 17: ["Mystic Arcanum (9th)"], 19: ["Ability Score Improvement"], 20: ["Eldritch Master"],
    };
    for (const [level, features] of Object.entries(expected)) for (const feature of features) expectFeature("2014", "Warlock", Number(level), feature);
  });

  it("locks 2024 Warlock class feature checkpoints", () => {
    const expected: Record<number, string[]> = {
      1: ["Eldritch Invocations", "Pact Magic"], 2: ["Magical Cunning"], 3: ["Subclass"],
      4: ["Ability Score Improvement"], 6: ["Subclass Feature"], 8: ["Ability Score Improvement"], 9: ["Contact Patron"],
      10: ["Subclass Feature"], 11: ["Mystic Arcanum (6th)"], 12: ["Ability Score Improvement"],
      13: ["Mystic Arcanum (7th)"], 14: ["Subclass Feature"], 15: ["Mystic Arcanum (8th)"],
      16: ["Ability Score Improvement"], 17: ["Mystic Arcanum (9th)"], 19: ["Epic Boon"], 20: ["Eldritch Master"],
    };
    for (const [level, features] of Object.entries(expected)) for (const feature of features) expectFeature("2024", "Warlock", Number(level), feature);
  });

  it("matches official Warlock spell, slot, invocation, and Arcanum tables", () => {
    expect(Array.from({ length: 20 }, (_, i) => getWarlockCantripCount(i + 1))).toEqual([2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4]);
    expect(Array.from({ length: 20 }, (_, i) => getWarlockKnownSpellLimit(i + 1, "dnd_2014"))).toEqual([2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15]);
    expect(Array.from({ length: 20 }, (_, i) => getWarlockPreparedSpellLimit(i + 1, "dnd_2024"))).toEqual([2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15]);
    expect(Array.from({ length: 20 }, (_, i) => getPactMagicSlots("Warlock", i + 1)[0]).map((slot) => [slot.level, slot.max])).toEqual([
      [1,1],[1,2],[2,2],[2,2],[3,2],[3,2],[4,2],[4,2],[5,2],[5,2],[5,3],[5,3],[5,3],[5,3],[5,3],[5,3],[5,4],[5,4],[5,4],[5,4],
    ]);
    expect(Array.from({ length: 20 }, (_, i) => getInvocationChoiceCount("Warlock", i + 1, "dnd_2014"))).toEqual([0,2,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8]);
    expect(Array.from({ length: 20 }, (_, i) => getInvocationChoiceCount("Warlock", i + 1, "dnd_2024"))).toEqual([1,3,3,3,5,5,6,6,7,7,7,8,8,8,9,9,9,10,10,10]);
    expect(Array.from({ length: 20 }, (_, i) => getMysticArcanumSpellLevels(i + 1))).toEqual([
      [],[],[],[],[],[],[],[],[],[],[6],[6],[6,7],[6,7],[6,7,8],[6,7,8],[6,7,8,9],[6,7,8,9],[6,7,8,9],[6,7,8,9],
    ]);
  });

  it("locks every official 2024 Warlock patron and feature level", () => {
    const subclasses = mergedSubclasses("2024", "Warlock");
    expect(subclasses.map((entry) => entry.name).sort()).toEqual(["Archfey Patron", "Celestial Patron", "Fiend Patron", "Great Old One Patron"].sort());
    for (const subclass of subclasses) expect([...new Set(subclass.features.map((feature) => feature.level))].sort((a,b) => a-b)).toEqual([3,6,10,14]);
    expect(getWarlockSubclassFeatureLevels("dnd_2024")).toEqual([3,6,10,14]);
  });

  it("locks 2014 and 2024 Wizard class feature checkpoints", () => {
    const legacy: Record<number, string[]> = {
      1: ["Spellcasting", "Arcane Recovery"], 2: ["Arcane Tradition"], 4: ["Ability Score Improvement"],
      6: ["Arcane Tradition Feature"], 8: ["Ability Score Improvement"], 10: ["Arcane Tradition Feature"],
      12: ["Ability Score Improvement"], 14: ["Arcane Tradition Feature"], 16: ["Ability Score Improvement"],
      18: ["Spell Mastery"], 19: ["Ability Score Improvement"], 20: ["Signature Spells"],
    };
    const modern: Record<number, string[]> = {
      1: ["Spellcasting", "Ritual Adept", "Arcane Recovery"], 2: ["Scholar"], 3: ["Subclass"], 4: ["Ability Score Improvement"],
      5: ["Memorize Spell"], 6: ["Subclass Feature"], 8: ["Ability Score Improvement"], 10: ["Subclass Feature"],
      12: ["Ability Score Improvement"], 14: ["Subclass Feature"], 16: ["Ability Score Improvement"], 18: ["Spell Mastery"],
      19: ["Epic Boon"], 20: ["Signature Spells"],
    };
    for (const [level, features] of Object.entries(legacy)) for (const feature of features) expectFeature("2014", "Wizard", Number(level), feature);
    for (const [level, features] of Object.entries(modern)) for (const feature of features) expectFeature("2024", "Wizard", Number(level), feature);
  });

  it("matches official Wizard spellbook, prepared spell, cantrip, and Arcane Recovery tables", () => {
    expect(Array.from({ length: 20 }, (_, i) => getWizardCantripCount(i + 1))).toEqual([3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5]);
    expect(Array.from({ length: 20 }, (_, i) => getWizardSpellbookMinimum(i + 1))).toEqual([6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44]);
    expect(Array.from({ length: 20 }, (_, i) => getWizardPreparedSpellLimit(i + 1, "dnd_2024"))).toEqual([4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25]);
    expect(Array.from({ length: 20 }, (_, i) => getArcaneRecoveryBudget(i + 1))).toEqual([1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10]);
  });

  it("locks every official 2024 Wizard subclass and feature level", () => {
    const subclasses = mergedSubclasses("2024", "Wizard");
    expect(subclasses.map((entry) => entry.name).sort()).toEqual(["Abjurer", "Diviner", "Evoker", "Illusionist"].sort());
    for (const subclass of subclasses) expect([...new Set(subclass.features.map((feature) => feature.level))].sort((a,b) => a-b)).toEqual([3,6,10,14]);
    expect(getWizardSubclassFeatureLevels("dnd_2024")).toEqual([3,6,10,14]);
  });
});
