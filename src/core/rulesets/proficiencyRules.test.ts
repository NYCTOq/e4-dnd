import { describe, expect, it } from "vitest";
import type { DndBackgroundData, DndClassData } from "./ruleset.types";
import { buildFinalSkillProficiencies, getExpertiseLimit, normalizeClassSkillChoices, normalizeExpertise } from "./proficiencyRules";

const classData = { skillChoices: { choose: 2, from: ["Athletics", "Perception", "Survival"] } } as DndClassData;
const background = { skillProficiencies: ["Athletics", "Insight"] } as DndBackgroundData;

describe("proficiency rules", () => {
  it("blocks background duplicates and respects class quota", () => {
    expect(normalizeClassSkillChoices(["Athletics", "Perception", "Survival"], classData, background)).toEqual(["Perception", "Survival"]);
  });
  it("combines background and selected class skills without duplicates", () => {
    expect(buildFinalSkillProficiencies(["Perception"], classData, background)).toEqual(["Athletics", "Insight", "Perception"]);
  });
  it("limits expertise to proficient skills and class progression", () => {
    expect(getExpertiseLimit("Rogue", 6)).toBe(4);
    expect(normalizeExpertise(["Stealth", "Arcana"], ["Stealth"], 2)).toEqual(["Stealth"]);
  });
});
