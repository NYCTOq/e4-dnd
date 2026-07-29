import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const detail = readFileSync(
  new URL("../../features/characters/CharacterDetail.tsx", import.meta.url),
  "utf8",
);
const e2e = readFileSync(
  new URL("../../../e2e/character-derived-stats-v5.118D.spec.ts", import.meta.url),
  "utf8",
);

describe("v5.118D character derived stats UI E2E contract", () => {
  it("publishes stable physical interaction and snapshot hooks", () => {
    for (const testId of [
      "derived-stats-command-center",
      "derived-stats-defense-summary",
      "derived-stats-grid",
      "derived-stat-armor-class",
      "derived-stat-proficiency",
      "derived-stat-initiative",
      "derived-stat-passive-perception",
      "derived-stats-initiative-roll",
    ]) expect(detail).toContain(`data-testid="${testId}"`);
  });

  it("requires physical pointer and keyboard paths in both browser projects", () => {
    expect(e2e).toContain(".click()");
    expect(e2e).toMatch(/(?:keyboard\.press\("Enter"\)|\.press\("Enter"\))/);
    expect(e2e).toContain("elementFromPoint");
    expect(e2e).not.toContain(".evaluate((element)");
  });
});
