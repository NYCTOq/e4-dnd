import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const reportPath = resolve(
  root,
  "certification-reports/class-subclass-ui-contract-v5.112D1.json",
);

describe("v5.112D1 class/subclass UI contract gate", () => {
  it("runtime exists", () => {
    expect(
      existsSync(
        resolve(root, "src/core/rulesets/classSubclassRuntimeRules.ts"),
      ),
    ).toBe(true);
  });

  it("character adapter exists", () => {
    expect(
      existsSync(
        resolve(root, "src/core/rulesets/classSubclassCharacterAdapter.ts"),
      ),
    ).toBe(true);
  });

  it("contract report exists", () => {
    expect(existsSync(reportPath)).toBe(true);
  });

  it("finds Character Detail, Play Mode and storage candidates", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));

    expect(report.candidates.characterDetail.length).toBeGreaterThan(0);
    expect(report.candidates.playMode.length).toBeGreaterThan(0);
    expect(report.candidates.storage.length).toBeGreaterThan(0);
  });

  it("preserves selector and route data", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));

    expect(Array.isArray(report.consolidated.testIds)).toBe(true);
    expect(Array.isArray(report.consolidated.routes)).toBe(true);
    expect(Array.isArray(report.consolidated.exports)).toBe(true);
  });
});
