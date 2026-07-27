import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { REMAINING_SYSTEM_DOMAINS } from "../discovery/remainingSystemDiscovery";

describe("v5.118A discovery evidence contract", () => {
  it("keeps every declared evidence path grounded in the project", () => {
    for (const domain of REMAINING_SYSTEM_DOMAINS) {
      for (const evidence of domain.evidence) {
        expect(existsSync(new URL(`../../../${evidence}`, import.meta.url)), `${domain.id}: ${evidence}`).toBe(true);
      }
    }
  });

  it("keeps the foundation command and selected next domain explicit", () => {
    const packageSource = readFileSync(new URL("../../../package.json", import.meta.url), "utf8");
    expect(packageSource).toContain("certify:remaining-system:foundation");
    expect(packageSource).toContain("discover-remaining-system-v5-118A.mjs");
    expect(REMAINING_SYSTEM_DOMAINS.filter((domain) => domain.status === "selected").map((domain) => domain.id))
      .toEqual(["character-sheet-derived-stats"]);
  });
});
