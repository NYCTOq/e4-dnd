import { describe, expect, it } from "vitest";
import { buildPostReleaseQaReport, mergeQaScenarioResults, REQUIRED_PLAYER_QA_SCENARIOS, type PlayerQaScenario } from "./postReleaseQa";

const passAll = (): PlayerQaScenario[] => REQUIRED_PLAYER_QA_SCENARIOS.map((id) => ({ id, label: id, status: "pass", critical: true }));

describe("post-release player QA", () => {
  it("certifies the complete required player journey matrix", () => {
    const report = buildPostReleaseQaReport("5.1.0", passAll());
    expect(report).toMatchObject({ ready: true, score: 100, passed: 11, failed: 0 });
  });

  it("turns missing scenarios into visible warnings", () => {
    const report = buildPostReleaseQaReport("5.1.0", []);
    expect(report.ready).toBe(true);
    expect(report.warnings).toBe(REQUIRED_PLAYER_QA_SCENARIOS.length);
    expect(report.notes[0]).toContain("henüz sağlanmadı");
  });

  it("blocks release on a critical player journey failure", () => {
    const scenarios = passAll();
    scenarios[0] = { ...scenarios[0], status: "fail", detail: "Builder crashed." };
    const report = buildPostReleaseQaReport("5.1.0", scenarios);
    expect(report.ready).toBe(false);
    expect(report.blockers).toContain("2014-fighter-journey: Builder crashed.");
  });

  it("keeps non-critical failures as review notes", () => {
    const report = buildPostReleaseQaReport("5.1.0", [...passAll(), { id: "visual-polish", label: "Visual polish", status: "fail", critical: false }]);
    expect(report.ready).toBe(true);
    expect(report.notes.some((note) => note.includes("Visual polish"))).toBe(true);
  });

  it("retains the worst duplicate scenario result", () => {
    const merged = mergeQaScenarioResults(
      [{ id: "backup-round-trip", label: "Backup", status: "pass" }],
      [{ id: "backup-round-trip", label: "Backup", status: "fail", detail: "Restore mismatch" }],
    );
    expect(merged).toEqual([{ id: "backup-round-trip", label: "Backup", status: "fail", detail: "Restore mismatch" }]);
  });

  it("includes extra regression scenarios in the score", () => {
    const report = buildPostReleaseQaReport("5.1.0", [...passAll(), { id: "legacy-import", label: "Legacy import", status: "warning" }]);
    expect(report.scenarios).toHaveLength(12);
    expect(report.score).toBe(96);
  });
});
