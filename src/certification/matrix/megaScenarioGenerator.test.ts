import { describe, expect, it } from "vitest";
import { generateMegaScenarios } from "./megaScenarioGenerator";

describe("mega certification scenario generator", () => {
  it("generates more than 100 deterministic unique scenarios", () => {
    const first = generateMegaScenarios();
    const second = generateMegaScenarios();
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(100);
    expect(new Set(first.map((entry) => entry.id)).size).toBe(first.length);
  });

  it("covers both rulesets and viewports", () => {
    const scenarios = generateMegaScenarios();
    expect(new Set(scenarios.map((entry) => entry.ruleset))).toEqual(new Set(["dnd_2014","dnd_2024"]));
    expect(new Set(scenarios.map((entry) => entry.viewport))).toEqual(new Set(["desktop","mobile"]));
  });

  it("covers every core class", () => {
    const scenarios = generateMegaScenarios();
    expect(new Set(scenarios.map((entry) => entry.className)).size).toBe(12);
  });
});
