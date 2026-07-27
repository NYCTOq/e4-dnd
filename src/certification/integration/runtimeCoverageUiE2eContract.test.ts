import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../../features/rulesets/RulesetCenterPage.tsx", import.meta.url),
  "utf8",
);
const e2eSource = readFileSync(
  new URL("../../../e2e/runtime-coverage-ui-v5.119D.spec.ts", import.meta.url),
  "utf8",
);

describe("v5.119D runtime coverage UI E2E contract", () => {
  it("publishes stable panel, category and details hooks", () => {
    expect(pageSource).toContain('data-testid="runtime-coverage-certification"');
    expect(pageSource).toContain("runtime-coverage-${group.id}");
    expect(pageSource).toContain("runtime-coverage-details-${group.id}");
    expect(pageSource).toContain("runtime-coverage-summary-${group.id}");
  });

  it("requires pointer, keyboard, interception and overflow paths", () => {
    expect(e2eSource).toContain(".click()");
    expect(e2eSource).toContain('keyboard.press("Enter")');
    expect(e2eSource).toContain("elementFromPoint");
    expect(e2eSource).toContain("scrollWidth");
    expect(e2eSource).not.toContain(".evaluate((element)");
  });
});
