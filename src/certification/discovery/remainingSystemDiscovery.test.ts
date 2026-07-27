import { describe, expect, it } from "vitest";
import {
  buildRemainingSystemDiscovery,
  REMAINING_SYSTEM_DOMAINS,
} from "./remainingSystemDiscovery";

describe("v5.118A remaining system discovery", () => {
  it("classifies every remaining domain with evidence and exit criteria", () => {
    expect(REMAINING_SYSTEM_DOMAINS).toHaveLength(8);
    expect(REMAINING_SYSTEM_DOMAINS.every((domain) => domain.evidence.length > 0)).toBe(true);
    expect(REMAINING_SYSTEM_DOMAINS.every((domain) => domain.gaps.length > 0)).toBe(true);
    expect(REMAINING_SYSTEM_DOMAINS.every((domain) => domain.exitCriteria.length > 0)).toBe(true);
  });

  it("locks one P0 target and the v5.118B handoff", () => {
    const report = buildRemainingSystemDiscovery();
    expect(report).toMatchObject({
      package: "v5.118A",
      version: "5.118.0",
      status: "READY_FOR_CLOSURE",
      selectedDomain: "character-sheet-derived-stats",
      nextPackage: "v5.118B",
      counts: { P0: 1, P1: 4, P2: 3 },
    });
    expect(report.blockers.length).toBeGreaterThan(0);
  });
});
