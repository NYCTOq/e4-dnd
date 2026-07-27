import { describe, expect, it } from "vitest";
import { CERTIFIED_CLASSES } from "../reference/classes.full.reference";
import {
  CERTIFIED_BACKGROUNDS_2014,
  CERTIFIED_BACKGROUNDS_2024,
} from "../reference/backgrounds.full.reference";
import {
  expectedBaseSkillCount,
  getCertifiedBackground,
  getCertifiedClass,
} from "./classBackgroundOracle";

describe("class and background certification oracle", () => {
  it("contains all 12 core classes", () => {
    expect(CERTIFIED_CLASSES).toHaveLength(12);
    expect(new Set(CERTIFIED_CLASSES.map((entry) => entry.id)).size).toBe(12);
  });

  it("contains expected background catalog sizes", () => {
    expect(CERTIFIED_BACKGROUNDS_2014).toHaveLength(12);
    expect(CERTIFIED_BACKGROUNDS_2024).toHaveLength(16);
  });

  it.each(CERTIFIED_CLASSES)("$name has valid hit die and two saves", (entry) => {
    expect([6,8,10,12]).toContain(entry.hitDie);
    expect(entry.savingThrows).toHaveLength(2);
    expect(entry.skillChoices).toBeGreaterThanOrEqual(2);
  });

  it.each(CERTIFIED_BACKGROUNDS_2014)("$name 2014 grants two skills", (entry) => {
    expect(entry.skillCount).toBe(2);
    expect(entry.grantsOriginFeat).toBe(false);
  });

  it.each(CERTIFIED_BACKGROUNDS_2024)("$name 2024 grants origin feat structure", (entry) => {
    expect(entry.skillCount).toBe(2);
    expect(entry.grantsOriginFeat).toBe(true);
    expect(entry.abilityChoiceCount).toBe(3);
  });

  it("computes Half-Elf Bard Entertainer skill count", () => {
    expect(expectedBaseSkillCount({
      ruleset:"dnd_2014",
      className:"Bard",
      backgroundName:"Entertainer",
      ancestrySkillChoices:2,
    })).toBe(7);
  });

  it("computes 2024 Human Fighter Soldier skill count", () => {
    expect(expectedBaseSkillCount({
      ruleset:"dnd_2024",
      className:"Fighter",
      backgroundName:"Soldier",
      ancestrySkillChoices:1,
    })).toBe(5);
  });

  it("resolves records by id and display name", () => {
    expect(getCertifiedClass("wizard")?.name).toBe("Wizard");
    expect(getCertifiedBackground("dnd_2024","Soldier")?.id).toBe("soldier");
  });
});
