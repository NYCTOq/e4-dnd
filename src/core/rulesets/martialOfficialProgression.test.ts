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
const classFeatureMap = (edition: "2014" | "2024", classId: string) => {
  const classData = classes(edition).find((entry) => entry.id === classId);
  expect(classData, `${edition} ${classId} must exist`).toBeDefined();
  return Object.fromEntries((classData?.levels ?? []).map((row) => [row.level, row.features]));
};
const expectFeatures = (actual: Record<number, string[]>, expected: Record<number, string[]>) => {
  for (const [level, features] of Object.entries(expected)) {
    for (const feature of features) expect(actual[Number(level)], `L${level} must include ${feature}`).toContain(feature);
  }
};

describe("official martial class progression", () => {
  it("matches the complete 2014 Fighter feature checkpoints", () => {
    expectFeatures(classFeatureMap("2014", "fighter"), {
      1:["Fighting Style","Second Wind"],2:["Action Surge"],3:["Martial Archetype"],4:["Ability Score Improvement"],
      5:["Extra Attack"],6:["Ability Score Improvement"],7:["Martial Archetype Feature"],8:["Ability Score Improvement"],
      9:["Indomitable"],10:["Martial Archetype Feature"],11:["Extra Attack (2)"],12:["Ability Score Improvement"],
      13:["Indomitable (2)"],14:["Ability Score Improvement"],15:["Martial Archetype Feature"],16:["Ability Score Improvement"],
      17:["Action Surge (2)","Indomitable (3)"],18:["Martial Archetype Feature"],19:["Ability Score Improvement"],20:["Extra Attack (3)"],
    });
  });

  it("matches the complete 2014 Rogue feature checkpoints", () => {
    expectFeatures(classFeatureMap("2014", "rogue"), {
      1:["Expertise","Sneak Attack","Thieves’ Cant"],2:["Cunning Action"],3:["Roguish Archetype"],4:["Ability Score Improvement"],
      5:["Uncanny Dodge"],6:["Expertise"],7:["Evasion"],8:["Ability Score Improvement"],9:["Roguish Archetype Feature"],
      10:["Ability Score Improvement"],11:["Reliable Talent"],12:["Ability Score Improvement"],13:["Roguish Archetype Feature"],
      14:["Blindsense"],15:["Slippery Mind"],16:["Ability Score Improvement"],17:["Roguish Archetype Feature"],
      18:["Elusive"],19:["Ability Score Improvement"],20:["Stroke of Luck"],
    });
  });

  it("matches the complete 2024 Fighter feature checkpoints", () => {
    expectFeatures(classFeatureMap("2024", "fighter"), {
      1:["Fighting Style","Second Wind","Weapon Mastery"],2:["Action Surge","Tactical Mind"],3:["Subclass"],4:["Ability Score Improvement"],
      5:["Extra Attack","Tactical Shift"],6:["Ability Score Improvement"],7:["Subclass Feature"],8:["Ability Score Improvement"],
      9:["Indomitable","Tactical Master"],10:["Subclass Feature"],11:["Two Extra Attacks"],12:["Ability Score Improvement"],
      13:["Studied Attacks"],14:["Ability Score Improvement"],15:["Subclass Feature"],16:["Ability Score Improvement"],
      17:["Action Surge (2)","Indomitable (3)"],18:["Subclass Feature"],19:["Epic Boon"],20:["Three Extra Attacks"],
    });
  });

  it("matches the complete 2024 Rogue feature checkpoints", () => {
    expectFeatures(classFeatureMap("2024", "rogue"), {
      1:["Expertise","Sneak Attack","Thieves’ Cant","Weapon Mastery"],2:["Cunning Action"],3:["Steady Aim","Subclass"],
      4:["Ability Score Improvement"],5:["Cunning Strike","Uncanny Dodge"],6:["Expertise"],7:["Evasion","Reliable Talent"],
      8:["Ability Score Improvement"],9:["Subclass Feature"],10:["Ability Score Improvement"],11:["Improved Cunning Strike"],
      12:["Ability Score Improvement"],13:["Subclass Feature"],14:["Devious Strikes"],15:["Slippery Mind"],
      16:["Ability Score Improvement"],17:["Subclass Feature"],18:["Elusive"],19:["Epic Boon"],20:["Stroke of Luck"],
    });
  });

  it("contains all four official 2024 subclasses for each martial class", () => {
    const expected: Record<string, string[]> = {
      Barbarian:["Path of the Berserker","Path of the Wild Heart","Path of the World Tree","Path of the Zealot"],
      Fighter:["Battle Master","Champion","Eldritch Knight","Psi Warrior"],
      Monk:["Warrior of Mercy","Warrior of Shadow","Warrior of the Elements","Warrior of the Open Hand"],
      Rogue:["Arcane Trickster","Assassin","Soulknife","Thief"],
    };
    const all = subclasses("2024");
    for (const [className, names] of Object.entries(expected)) {
      expect(all.filter((entry) => entry.className === className).map((entry) => entry.name).sort()).toEqual([...names].sort());
    }
  });

  it("keeps official 2024 martial subclass feature levels", () => {
    const expected: Record<string, number[]> = {
      "Path of the Berserker":[3,6,10,14],"Path of the Wild Heart":[3,6,10,14],"Path of the World Tree":[3,6,10,14],"Path of the Zealot":[3,6,10,14],
      "Battle Master":[3,7,10,15,18],Champion:[3,7,10,15,18],"Eldritch Knight":[3,7,10,15,18],"Psi Warrior":[3,7,10,15,18],
      "Warrior of Mercy":[3,6,11,17],"Warrior of Shadow":[3,6,11,17],"Warrior of the Elements":[3,6,11,17],"Warrior of the Open Hand":[3,6,11,17],
      "Arcane Trickster":[3,9,13,17],Assassin:[3,9,13,17],Soulknife:[3,9,13,17],Thief:[3,9,13,17],
    };
    const all = subclasses("2024");
    for (const [name, levels] of Object.entries(expected)) {
      const subclass = all.find((entry) => entry.name === name);
      expect(subclass, `${name} must exist`).toBeDefined();
      expect([...new Set(subclass?.features.map((feature) => feature.level) ?? [])]).toEqual(levels);
    }
  });
});
