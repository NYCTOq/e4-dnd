import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const reportPath = resolve(
  root,
  "certification-reports/spell-ui-contract-v5.113D1.json",
);

describe("v5.113D1 spell UI contract gate", () => {
  it("spell runtime exists", () => {
    expect(
      existsSync(
        resolve(root, "src/core/rulesets/spellRuntimeCombatRules.ts"),
      ),
    ).toBe(true);
  });

  it("spell character adapter exists", () => {
    expect(
      existsSync(
        resolve(root, "src/core/rulesets/spellCharacterCombatAdapter.ts"),
      ),
    ).toBe(true);
  });

  it("contract report exists", () => {
    expect(existsSync(reportPath)).toBe(true);
  });

  it("finds Spellbook, Play Mode, Combat Tracker and storage", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));

    expect(report.candidates.spellbook.length).toBeGreaterThan(0);
    expect(report.candidates.playMode.length).toBeGreaterThan(0);
    expect(report.candidates.combatTracker.length).toBeGreaterThan(0);
    expect(report.candidates.storage.length).toBeGreaterThan(0);
  });

  it("preserves selector, route and export data", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));

    expect(Array.isArray(report.consolidated.testIds)).toBe(true);
    expect(Array.isArray(report.consolidated.routes)).toBe(true);
    expect(Array.isArray(report.consolidated.exports)).toBe(true);
  });
});
