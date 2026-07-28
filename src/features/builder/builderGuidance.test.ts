import { describe, expect, it } from "vitest";
import { getBuilderGuidanceSummary, normalizeBuilderStep, shouldConfirmRulesetChange } from "./builderGuidance";

describe("v5.125 builder guidance", () => {
  it("partitions errors, warnings and top actions", () => {
    const summary = getBuilderGuidanceSummary([
      { id: "a", severity: "error", step: "Basic", message: "Name" },
      { id: "b", severity: "warning", step: "Class", message: "Background" },
      { id: "c", severity: "error", step: "Abilities", message: "Budget" },
      { id: "d", severity: "warning", step: "Spells", message: "Prepared" },
    ]);
    expect(summary).toMatchObject({ errors: 2, warnings: 2 });
    expect(summary.top.map((issue) => issue.id)).toEqual(["a", "b", "c"]);
  });
  it("warns only when a real ruleset change can erase progress", () => {
    expect(shouldConfirmRulesetChange({ currentRuleset: "2014", nextRuleset: "2024", hasProgress: true })).toBe(true);
    expect(shouldConfirmRulesetChange({ currentRuleset: "2014", nextRuleset: "2014", hasProgress: true })).toBe(false);
    expect(shouldConfirmRulesetChange({ currentRuleset: "2014", nextRuleset: "2024", hasProgress: false })).toBe(false);
  });
  it("restores only safe builder step indexes", () => {
    expect(normalizeBuilderStep("5", 8)).toBe(5);
    expect(normalizeBuilderStep("99", 8)).toBe(0);
    expect(normalizeBuilderStep("x", 8)).toBe(0);
  });
});
