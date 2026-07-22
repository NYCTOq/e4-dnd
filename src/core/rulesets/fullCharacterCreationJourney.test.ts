import { describe, expect, it } from "vitest";
import { FULL_CHARACTER_CREATION_SCENARIOS, getCharacterCreationJourneyCoverage } from "./fullCharacterCreationJourney";

describe("full character creation journey coverage", () => {
  it("covers eight single-class journeys across both editions", () => {
    const report = getCharacterCreationJourneyCoverage();
    expect(report).toMatchObject({ scenarioCount: 8, classCount: 8, rulesetCount: 2, uniqueIds: true, ready: true });
  });

  it("covers builder, sheet, play mode and rest routes", () => {
    const report = getCharacterCreationJourneyCoverage();
    expect(report.coversBuilder).toBe(true);
    expect(report.coversSheet).toBe(true);
    expect(report.coversPlayMode).toBe(true);
    expect(report.coversRest).toBe(true);
  });

  it("contains caster and non-caster journeys", () => {
    expect(FULL_CHARACTER_CREATION_SCENARIOS.some((scenario) => scenario.requiresSpellcasting)).toBe(true);
    expect(FULL_CHARACTER_CREATION_SCENARIOS.some((scenario) => !scenario.requiresSpellcasting)).toBe(true);
  });
});
