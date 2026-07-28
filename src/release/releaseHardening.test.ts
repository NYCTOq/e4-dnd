import { describe, expect, it } from "vitest";
import { RELEASE_GATE_STEPS, RELEASE_HARDENING_LIMITS } from "./releaseHardening";

describe("v5.128 release hardening", () => {
  it("runs one deterministic release gate", () => {
    expect(RELEASE_GATE_STEPS).toEqual(["unit", "build", "artifact-audit", "critical-e2e"]);
    expect(new Set(RELEASE_GATE_STEPS).size).toBe(RELEASE_GATE_STEPS.length);
  });
  it("keeps explicit artifact budgets", () => {
    expect(RELEASE_HARDENING_LIMITS.maxEntryChunkBytes).toBeLessThan(500_000);
    expect(RELEASE_HARDENING_LIMITS.maxPrecacheBytes).toBeGreaterThan(2_000_000);
  });
});
