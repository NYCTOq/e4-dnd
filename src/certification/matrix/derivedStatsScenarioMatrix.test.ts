import { describe, expect, it } from "vitest";
import { generateDerivedStatsScenarios } from "./derivedStatsScenarioMatrix";

describe("derived stats mega matrix", () => {
  it("generates 240 deterministic scenarios", () => {
    const first = generateDerivedStatsScenarios();
    const second = generateDerivedStatsScenarios();
    expect(first).toEqual(second);
    expect(first).toHaveLength(240);
    expect(new Set(first.map((entry)=>entry.id)).size).toBe(240);
  });

  it("covers all proficiency tiers", () => {
    expect(new Set(generateDerivedStatsScenarios().map((entry)=>entry.proficiency)))
      .toEqual(new Set([0,1,2]));
  });

  it("covers levels across every proficiency band", () => {
    const levels = new Set(generateDerivedStatsScenarios().map((entry)=>entry.level));
    expect(levels.has(1)).toBe(true);
    expect(levels.has(5)).toBe(true);
    expect(levels.has(9)).toBe(true);
    expect(levels.has(13)).toBe(true);
    expect(levels.has(17)).toBe(true);
    expect(levels.has(20)).toBe(true);
  });

  it("keeps derived values in sane ranges", () => {
    for (const entry of generateDerivedStatsScenarios()) {
      expect(entry.initiative).toBeGreaterThanOrEqual(-1);
      expect(entry.passivePerception).toBeGreaterThanOrEqual(9);
      expect(entry.skillBonus).toBeGreaterThanOrEqual(-1);
      expect(entry.spellSaveDc).toBeGreaterThanOrEqual(9);
    }
  });
});
