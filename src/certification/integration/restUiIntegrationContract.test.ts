import { describe, expect, it } from "vitest";
import {
  accessSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const reportPath = resolve(
  root,
  "certification-reports/rest-ui-integration-contract-v5.111D1.json",
);

describe("v5.111D1 rest UI integration contract gate", () => {
  it("runtime module exists", () => {
    expect(
      existsSync(resolve(root, "src/core/rulesets/restRecoveryRules.ts")),
    ).toBe(true);
  });

  it("character adapter exists", () => {
    expect(
      existsSync(
        resolve(
          root,
          "src/core/rulesets/restRecoveryCharacterAdapter.ts",
        ),
      ),
    ).toBe(true);
  });

  it("discovery report exists", () => {
    expect(existsSync(reportPath)).toBe(true);
  });

  it("report contains UI candidates", () => {
    accessSync(reportPath);
    const report = JSON.parse(readFileSync(reportPath, "utf8"));

    expect(report.candidates.restCenter.length).toBeGreaterThan(0);
    expect(report.candidates.characterDetail.length).toBeGreaterThan(0);
    expect(report.candidates.storage.length).toBeGreaterThan(0);
  });

  it("report preserves machine-readable selector data", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));

    expect(Array.isArray(report.consolidated.testIds)).toBe(true);
    expect(Array.isArray(report.consolidated.routes)).toBe(true);
    expect(Array.isArray(report.consolidated.exportedSymbols)).toBe(true);
  });
});
