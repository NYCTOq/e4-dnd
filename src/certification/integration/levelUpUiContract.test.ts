import { describe, expect, it } from "vitest";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const reportPath = resolve(
  root,
  "certification-reports/level-up-ui-contract-v5.114D1.json",
);

describe("v5.114D1 level-up UI contract gate", () => {
  it("level-up runtime exists", () => {
    expect(
      existsSync(
        resolve(
          root,
          "src/core/rulesets/levelUpProgressionRules.ts",
        ),
      ),
    ).toBe(true);
  });

  it("level-up character adapter exists", () => {
    expect(
      existsSync(
        resolve(
          root,
          "src/core/rulesets/levelUpCharacterAdapter.ts",
        ),
      ),
    ).toBe(true);
  });

  it("contract report exists", () => {
    expect(existsSync(reportPath)).toBe(true);
  });

  it("finds Builder, Character Detail, Play Mode and persistence", () => {
    const report = JSON.parse(
      readFileSync(reportPath, "utf8"),
    );

    expect(report.candidates.builder.length).toBeGreaterThan(0);
    expect(
      report.candidates.characterDetail.length,
    ).toBeGreaterThan(0);
    expect(report.candidates.playMode.length).toBeGreaterThan(0);
    expect(report.candidates.persistence.length).toBeGreaterThan(0);
  });

  it("preserves route, selector, storage and export data", () => {
    const report = JSON.parse(
      readFileSync(reportPath, "utf8"),
    );

    expect(
      Array.isArray(report.consolidated.testIds),
    ).toBe(true);
    expect(
      Array.isArray(report.consolidated.routes),
    ).toBe(true);
    expect(
      Array.isArray(report.consolidated.storageKeys),
    ).toBe(true);
    expect(
      Array.isArray(report.consolidated.exports),
    ).toBe(true);
  });
});
