import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import {
  getBardCantripCount,
  getBardExpertiseCount,
  getBardicInspirationDie,
  getBardSpellLimit,
  getMagicalSecretsCount,
  getSongOfRestDie,
} from "./bardRules";
import {
  getMetamagicChoiceCountForSorcerer,
  getSorcererCantripCount,
  getSorcererKnownSpellLimit,
  getSorcererPreparedSpellLimit,
  getSorcererSubclassFeatureLevels,
  getSorceryPointMaximum,
  getSorcerousRestorationAmount,
} from "./sorcererRules";

const load = <T,>(path: string): T => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8")) as T;
const getClass = (edition: "2014" | "2024", id: string) => load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`).find((entry) => entry.id === id)!;
const subclasses = (edition: "2014" | "2024", className: string) => {
  const base = load<DndSubclassData[]>(`public/data/dnd_${edition}/subclasses.json`);
  const expansion = edition === "2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024;
  return [...base, ...expansion.filter((entry) => !base.some((baseEntry) => baseEntry.id === entry.id))]
    .filter((entry) => entry.className === className && entry.ruleset === `dnd_${edition}`);
};
const featuresAt = (klass: DndClassData, level: number) => klass.levels.find((entry) => entry.level === level)?.features ?? [];
const expectFeature = (klass: DndClassData, level: number, feature: string) => expect(featuresAt(klass, level), `${klass.name} L${level} missing ${feature}`).toContain(feature);

const BARD_2014_KNOWN = [4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22];
const BARD_2024_PREPARED = [4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
const SORCERER_2014_KNOWN = [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15];
const SORCERER_2024_PREPARED = [2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];

describe("Bard and Sorcerer independent official progression", () => {
  it("matches the complete 2014 Bard level table", () => {
    const bard = getClass("2014", "bard");
    expect(bard.levels).toHaveLength(20);
    expectFeature(bard, 1, "Bardic Inspiration");
    expectFeature(bard, 2, "Jack of All Trades");
    expectFeature(bard, 2, "Song of Rest");
    expectFeature(bard, 3, "Bard College");
    expectFeature(bard, 3, "Expertise");
    for (const level of [4,8,12,16,19]) expectFeature(bard, level, "Ability Score Improvement");
    expectFeature(bard, 5, "Font of Inspiration");
    expectFeature(bard, 6, "Countercharm");
    expectFeature(bard, 10, "Magical Secrets");
    expectFeature(bard, 14, "Magical Secrets");
    expectFeature(bard, 18, "Magical Secrets");
    expectFeature(bard, 20, "Superior Inspiration");
    expect(Array.from({ length: 20 }, (_, index) => getBardSpellLimit(index + 1, "dnd_2014"))).toEqual(BARD_2014_KNOWN);
    expect([1,5,10,15].map(getBardicInspirationDie)).toEqual([6,8,10,12]);
    expect([2,9,13,17].map((level) => getSongOfRestDie(level, "dnd_2014"))).toEqual([6,8,10,12]);
    expect([2,3,10].map((level) => getBardExpertiseCount(level, "dnd_2014"))).toEqual([0,2,4]);
    expect([9,10,14,18].map((level) => getMagicalSecretsCount(level, "dnd_2014"))).toEqual([0,2,4,6]);
  });

  it("matches the complete 2024 Bard level table", () => {
    const bard = getClass("2024", "bard");
    expect(bard.levels).toHaveLength(20);
    expectFeature(bard, 1, "Bardic Inspiration");
    expectFeature(bard, 2, "Expertise");
    expectFeature(bard, 2, "Jack of All Trades");
    expectFeature(bard, 3, "Bard Subclass");
    for (const level of [4,8,12,16]) expectFeature(bard, level, "Ability Score Improvement");
    expectFeature(bard, 5, "Font of Inspiration");
    expectFeature(bard, 7, "Countercharm");
    expectFeature(bard, 9, "Expertise");
    expectFeature(bard, 10, "Magical Secrets");
    expectFeature(bard, 18, "Superior Inspiration");
    expectFeature(bard, 19, "Epic Boon");
    expectFeature(bard, 20, "Words of Creation");
    expect(Array.from({ length: 20 }, (_, index) => getBardSpellLimit(index + 1, "dnd_2024"))).toEqual(BARD_2024_PREPARED);
    expect([1,4,10].map(getBardCantripCount)).toEqual([2,3,4]);
    expect([1,2,9].map((level) => getBardExpertiseCount(level, "dnd_2024"))).toEqual([0,2,4]);
    expect(getSongOfRestDie(20, "dnd_2024")).toBeNull();
    expect(getMagicalSecretsCount(20, "dnd_2024")).toBe(0);
  });

  it("contains every official 2024 Bard college and correct feature levels", () => {
    const manifest = new Map(subclasses("2024", "Bard").map((subclass) => [subclass.name, [...new Set(subclass.features.map((feature) => feature.level))].sort((a,b) => a-b)]));
    expect([...manifest.keys()].sort()).toEqual(["College of Dance", "College of Glamour", "College of Lore", "College of Valor"].sort());
    for (const levels of manifest.values()) expect(levels).toEqual([3,6,14]);
  });

  it("contains all supported official 2014 Bard colleges", () => {
    const names = subclasses("2014", "Bard").map((subclass) => subclass.name).sort();
    expect(names).toEqual([
      "College of Creation", "College of Eloquence", "College of Glamour", "College of Lore",
      "College of Spirits", "College of Swords", "College of Valor", "College of Whispers",
    ].sort());
    for (const subclass of subclasses("2014", "Bard")) {
      expect([...new Set(subclass.features.map((feature) => feature.level))].sort((a,b) => a-b)).toEqual([3,6,14]);
    }
  });

  it("matches the complete 2014 Sorcerer level table", () => {
    const sorcerer = getClass("2014", "sorcerer");
    expect(sorcerer.levels).toHaveLength(20);
    expectFeature(sorcerer, 1, "Sorcerous Origin");
    expectFeature(sorcerer, 2, "Font of Magic");
    expectFeature(sorcerer, 3, "Metamagic");
    for (const level of [4,8,12,16,19]) expectFeature(sorcerer, level, "Ability Score Improvement");
    for (const level of [6,14,18]) expectFeature(sorcerer, level, "Sorcerous Origin Feature");
    expectFeature(sorcerer, 20, "Sorcerous Restoration");
    expect(Array.from({ length: 20 }, (_, index) => getSorcererKnownSpellLimit(index + 1, "dnd_2014"))).toEqual(SORCERER_2014_KNOWN);
    expect([1,2,10,20].map(getSorceryPointMaximum)).toEqual([0,2,10,20]);
    expect([1,3,10,17].map((level) => getMetamagicChoiceCountForSorcerer(level, "dnd_2014"))).toEqual([0,2,3,4]);
    expect(getSorcerousRestorationAmount(20, "dnd_2014")).toBe(4);
  });

  it("matches the complete 2024 Sorcerer level table", () => {
    const sorcerer = getClass("2024", "sorcerer");
    expect(sorcerer.levels).toHaveLength(20);
    expectFeature(sorcerer, 1, "Innate Sorcery");
    expectFeature(sorcerer, 2, "Font of Magic");
    expectFeature(sorcerer, 2, "Metamagic");
    expectFeature(sorcerer, 3, "Sorcerer Subclass");
    for (const level of [4,8,12,16]) expectFeature(sorcerer, level, "Ability Score Improvement");
    expectFeature(sorcerer, 5, "Sorcerous Restoration");
    expectFeature(sorcerer, 7, "Sorcery Incarnate");
    expectFeature(sorcerer, 19, "Epic Boon");
    expectFeature(sorcerer, 20, "Arcane Apotheosis");
    expect(Array.from({ length: 20 }, (_, index) => getSorcererPreparedSpellLimit(index + 1, "dnd_2024"))).toEqual(SORCERER_2024_PREPARED);
    expect([1,4,10].map((level) => getSorcererCantripCount(level, "dnd_2024"))).toEqual([4,5,6]);
    expect([1,2,10,17].map((level) => getMetamagicChoiceCountForSorcerer(level, "dnd_2024"))).toEqual([0,2,4,6]);
    expect([4,5,20].map((level) => getSorcerousRestorationAmount(level, "dnd_2024"))).toEqual([0,2,10]);
  });

  it("contains every official 2024 Sorcerer subclass and correct feature levels", () => {
    const manifest = new Map(subclasses("2024", "Sorcerer").map((subclass) => [subclass.name, [...new Set(subclass.features.map((feature) => feature.level))].sort((a,b) => a-b)]));
    expect([...manifest.keys()].sort()).toEqual(["Aberrant Sorcery", "Clockwork Sorcery", "Draconic Sorcery", "Wild Magic Sorcery"].sort());
    for (const levels of manifest.values()) expect(levels).toEqual(getSorcererSubclassFeatureLevels("dnd_2024"));
  });
});
