import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";

const load = <T,>(path: string): T => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8")) as T;
const classes = (edition: "2014" | "2024") => load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`);
const subclasses = (edition: "2014" | "2024") => {
  const base = load<DndSubclassData[]>(`public/data/dnd_${edition}/subclasses.json`);
  const expansion = edition === "2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024;
  return [...base, ...expansion.filter((entry) => !base.some((baseEntry) => baseEntry.id === entry.id))];
};
const classData = (edition: "2014" | "2024", id: string) => classes(edition).find((entry) => entry.id === id)!;
const featuresAt = (edition: "2014" | "2024", id: string, level: number) => classData(edition, id).levels.find((row) => row.level === level)!.features;
const subclassMap = (edition: "2014" | "2024", className: string) => new Map(subclasses(edition).filter((entry) => entry.className === className).map((entry) => [entry.name, entry.features.map((feature) => feature.level)]));

function expectFeatures(edition: "2014" | "2024", classId: string, checkpoints: Record<number, string[]>) {
  for (const [level, expected] of Object.entries(checkpoints)) {
    expect(featuresAt(edition, classId, Number(level)), `${edition} ${classId} L${level}`).toEqual(expect.arrayContaining(expected));
  }
}

describe("Paladin and Ranger official level 1-20 progression", () => {
  it("locks 2014 Paladin progression checkpoints", () => {
    expectFeatures("2014", "paladin", {
      1: ["Divine Sense", "Lay on Hands"], 2: ["Fighting Style", "Spellcasting", "Divine Smite"],
      3: ["Divine Health", "Sacred Oath"], 4: ["Ability Score Improvement"], 5: ["Extra Attack"],
      6: ["Aura of Protection"], 7: ["Sacred Oath Feature"], 8: ["Ability Score Improvement"],
      10: ["Aura of Courage"], 11: ["Improved Divine Smite"], 12: ["Ability Score Improvement"],
      14: ["Cleansing Touch"], 15: ["Sacred Oath Feature"], 16: ["Ability Score Improvement"],
      18: ["Aura Improvements"], 19: ["Ability Score Improvement"], 20: ["Sacred Oath Capstone"],
    });
  });

  it("locks 2014 Ranger progression checkpoints", () => {
    expectFeatures("2014", "ranger", {
      1: ["Favored Enemy", "Natural Explorer"], 2: ["Fighting Style", "Spellcasting"],
      3: ["Ranger Archetype", "Primeval Awareness"], 4: ["Ability Score Improvement"], 5: ["Extra Attack"],
      6: ["Favored Enemy Improvement", "Natural Explorer Improvement"], 7: ["Ranger Archetype Feature"],
      8: ["Ability Score Improvement", "Land’s Stride"], 10: ["Natural Explorer Improvement", "Hide in Plain Sight"],
      11: ["Ranger Archetype Feature"], 12: ["Ability Score Improvement"], 14: ["Favored Enemy Improvement", "Vanish"],
      15: ["Ranger Archetype Feature"], 16: ["Ability Score Improvement"], 18: ["Feral Senses"],
      19: ["Ability Score Improvement"], 20: ["Foe Slayer"],
    });
  });

  it("locks 2024 Paladin progression checkpoints", () => {
    expectFeatures("2024", "paladin", {
      1: ["Lay on Hands", "Spellcasting", "Weapon Mastery"], 2: ["Fighting Style", "Paladin’s Smite"],
      3: ["Channel Divinity", "Subclass"], 4: ["Ability Score Improvement"], 5: ["Extra Attack", "Faithful Steed"],
      6: ["Aura of Protection"], 7: ["Subclass Feature"], 8: ["Ability Score Improvement"], 9: ["Abjure Foes"],
      10: ["Aura of Courage"], 11: ["Radiant Strikes"], 12: ["Ability Score Improvement"],
      14: ["Restoring Touch"], 15: ["Subclass Feature"], 16: ["Ability Score Improvement"],
      18: ["Aura Expansion"], 19: ["Epic Boon"], 20: ["Subclass Feature"],
    });
  });

  it("locks 2024 Ranger progression checkpoints", () => {
    expectFeatures("2024", "ranger", {
      1: ["Spellcasting", "Favored Enemy", "Weapon Mastery"], 2: ["Deft Explorer", "Fighting Style"],
      3: ["Ranger Subclass"], 4: ["Ability Score Improvement"], 5: ["Extra Attack"], 6: ["Roving"],
      7: ["Subclass Feature"], 8: ["Ability Score Improvement"], 9: ["Expertise"], 10: ["Tireless"],
      11: ["Subclass Feature"], 12: ["Ability Score Improvement"], 13: ["Relentless Hunter"],
      14: ["Nature’s Veil"], 15: ["Subclass Feature"], 16: ["Ability Score Improvement"],
      17: ["Precise Hunter"], 18: ["Feral Senses"], 19: ["Epic Boon"], 20: ["Foe Slayer"],
    });
  });

  it("contains all four official 2024 Paladin subclasses at 3/7/15/20", () => {
    const map = subclassMap("2024", "Paladin");
    expect([...map.keys()].sort()).toEqual(["Oath of Devotion", "Oath of Glory", "Oath of the Ancients", "Oath of Vengeance"].sort());
    for (const levels of map.values()) for (const required of [3, 7, 15, 20]) expect(levels).toContain(required);
  });

  it("contains all four official 2024 Ranger subclasses at 3/7/11/15", () => {
    const map = subclassMap("2024", "Ranger");
    expect([...map.keys()].sort()).toEqual(["Beast Master", "Fey Wanderer", "Gloom Stalker", "Hunter"].sort());
    for (const levels of map.values()) for (const required of [3, 7, 11, 15]) expect(levels).toContain(required);
  });
});
