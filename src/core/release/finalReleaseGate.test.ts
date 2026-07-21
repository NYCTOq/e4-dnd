import { describe, expect, it } from "vitest";
import { buildFinalReleaseGate, type FinalGateEvidence } from "./finalReleaseGate";

const passingEvidence = (): FinalGateEvidence => ({
  unitTests: "pass",
  productionBuild: "pass",
  lint: "pass",
  browserE2e: "pass",
  backupRoundTrip: "pass",
  offlineRefresh: "pass",
  mobileNavigation: "pass",
  characterJourney: "pass",
});

describe("v5.70 final release gate", () => {
  it("certifies a fully evidenced release", () => {
    expect(buildFinalReleaseGate("5.70.0", passingEvidence())).toMatchObject({ ready: true, score: 100, blockers: [], warnings: [] });
  });

  it("keeps unavailable browser evidence visible without inventing success", () => {
    const report = buildFinalReleaseGate("5.70.0", { ...passingEvidence(), browserE2e: "warning" });
    expect(report.ready).toBe(true);
    expect(report.score).toBe(94);
    expect(report.warnings).toContain("Browser E2E doğrulanmayı bekliyor.");
  });

  it("blocks failed player journeys and production builds", () => {
    const report = buildFinalReleaseGate("5.70.0", { ...passingEvidence(), productionBuild: "fail", characterJourney: "fail" });
    expect(report.ready).toBe(false);
    expect(report.blockers).toHaveLength(2);
  });

  it("blocks unresolved crashes and migration failures", () => {
    const report = buildFinalReleaseGate("5.70.0", { ...passingEvidence(), unresolvedCrashes: 1, migrationFailures: 2 });
    expect(report.ready).toBe(false);
    expect(report.blockers).toContain("1 çözülmemiş crash kaydı var.");
    expect(report.blockers).toContain("2 migration hatası var.");
  });
});
