import { describe, expect, it } from "vitest";
import { buildRemainingPlayerExperienceDiscovery, REMAINING_PLAYER_EXPERIENCE_DOMAINS } from "./remainingPlayerExperienceDiscovery";

describe("v5.122A remaining player experience discovery", () => {
  it("classifies eight player-facing domains with questions, evidence and exit criteria", () => {
    expect(REMAINING_PLAYER_EXPERIENCE_DOMAINS).toHaveLength(8);
    expect(REMAINING_PLAYER_EXPERIENCE_DOMAINS.every((domain) => domain.playerQuestion.length > 20)).toBe(true);
    expect(REMAINING_PLAYER_EXPERIENCE_DOMAINS.every((domain) => domain.evidence.length >= 3)).toBe(true);
    expect(REMAINING_PLAYER_EXPERIENCE_DOMAINS.every((domain) => domain.strengths.length > 0)).toBe(true);
    expect(REMAINING_PLAYER_EXPERIENCE_DOMAINS.every((domain) => domain.gaps.length > 0)).toBe(true);
    expect(REMAINING_PLAYER_EXPERIENCE_DOMAINS.every((domain) => domain.exitCriteria.length > 0)).toBe(true);
  });

  it("locks one P0 character hub target and the v5.122B handoff", () => {
    expect(buildRemainingPlayerExperienceDiscovery()).toMatchObject({
      package: "v5.122A",
      version: "5.122.0",
      status: "READY_FOR_EXPERIENCE_MATRIX",
      selectedDomain: "character-hub-actionability",
      nextPackage: "v5.122B",
      domainCount: 8,
      counts: { P0: 1, P1: 5, P2: 2 },
    });
  });

  it("keeps monitored performance and preference work outside the immediate release blockers", () => {
    const report = buildRemainingPlayerExperienceDiscovery();
    expect(report.blockers.some((entry) => entry.startsWith("performance-perceived-speed:"))).toBe(false);
    expect(report.blockers.some((entry) => entry.startsWith("preferences-continuity:"))).toBe(false);
    expect(report.blockers.length).toBeGreaterThan(0);
  });
});
