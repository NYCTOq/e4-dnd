import { describe, expect, it } from "vitest";
import { getAncestryBuilderContract, getAncestryGrantedSpells, mergeAncestrySkills } from "./ancestryChoiceRules";

const race = (name: string) => ({ id: name.toLowerCase(), name, speed: 30, size: "Medium", abilityBonuses: {}, traits: [] });

describe("ancestry choice rules", () => {
  it("gives 2024 Human one skill and one origin feat", () => {
    expect(getAncestryBuilderContract("dnd_2024", race("Human") as never)).toMatchObject({
      skillChoiceCount: 1,
      originFeatChoiceCount: 1,
      sizeChoice: true,
    });
  });

  it("gives 2014 Half-Elf two skills", () => {
    expect(getAncestryBuilderContract("dnd_2014", race("Half-Elf") as never).skillChoiceCount).toBe(2);
  });

  it("requires Dragonborn ancestry", () => {
    const contract = getAncestryBuilderContract("dnd_2024", race("Dragonborn") as never);
    expect(contract.choiceRequired).toBe(true);
    expect(contract.options.length).toBe(5);
  });

  it("merges fixed and selected ancestry skills", () => {
    const contract = getAncestryBuilderContract("dnd_2024", race("Halfling") as never);
    expect(mergeAncestrySkills(["Athletics"], contract, [])).toEqual(["Athletics", "Stealth"]);
  });

  it("unlocks legacy spells by level", () => {
    expect(getAncestryGrantedSpells("dnd_2014", "Tiefling", "", 5, null)).toEqual(
      expect.arrayContaining(["Thaumaturgy", "Hellish Rebuke", "Darkness"]),
    );
  });
});
