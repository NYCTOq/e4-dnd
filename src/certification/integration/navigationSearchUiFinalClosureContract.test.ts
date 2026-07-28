import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "src/shared/navigation/navigationSearchAliases.ts",
  "src/shared/commands/CommandPalette.tsx",
  "e2e/navigation-search-ui-v5.123D.spec.ts",
  "scripts/audit-navigation-search-ui-v5-123D.mjs",
  "certification-reports/navigation-search-ui-final-closure-v5.123D.json",
  "certification-reports/navigation-search-ui-final-closure-v5.123D.md",
];

describe("v5.123D navigation/search UI artifact contract", () => {
  for (const path of required) it(`${path} exists`, () => expect(existsSync(path)).toBe(true));
  it("report has no blockers", () => {
    const report = JSON.parse(readFileSync("certification-reports/navigation-search-ui-final-closure-v5.123D.json", "utf8"));
    expect(report.releaseBlockers).toEqual([]);
    expect(report.browserScenarios).toBe(8);
  });
});
