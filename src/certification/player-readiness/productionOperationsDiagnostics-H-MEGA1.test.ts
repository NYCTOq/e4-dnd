import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type OpsDomain = {
  id: string;
  label: string;
  requiredAll: string[];
  requiredAny?: string[];
  blockers: string[];
  status: "ready" | "blocked";
};

const projectRoot = process.cwd();

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function makeDomain(
  id: string,
  label: string,
  requiredAll: string[],
  requiredAny: string[] = [],
): OpsDomain {
  const blockers = requiredAll
    .filter((required) => !exists(required))
    .map((required) => `Missing required artifact: ${required}`);

  if (
    requiredAny.length > 0 &&
    !requiredAny.some((candidate) => exists(candidate))
  ) {
    blockers.push(
      `Missing at least one alternative: ${requiredAny.join(", ")}`,
    );
  }

  return {
    id,
    label,
    requiredAll,
    requiredAny,
    blockers,
    status: blockers.length === 0 ? "ready" : "blocked",
  };
}

function buildOperationsManifest() {
  const domains = [
    makeDomain("golden-release", "Golden Release Baseline", [
      "src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts",
      "release/GOLDEN_RELEASE_ASSET_MANIFEST_G_MEGA2.json",
      "release/GOLDEN_RELEASE_CHECKLIST_G_MEGA2.md",
    ]),
    makeDomain("post-release", "Post-Release QA", [
      "src/core/release/postReleaseQa.test.ts",
      "src/core/release/stableReleaseHardening.test.ts",
      "src/core/release/finalReleaseGate.test.ts",
      "src/core/quality/releaseReadinessAudit.test.ts",
    ]),
    makeDomain("storage", "Storage Health and Recovery", [
      "src/core/storage/characterHydration.test.ts",
      "src/features/backup/backupRecovery.test.ts",
      "src/features/backup/fullBackup.test.ts",
      "src/features/characters/characterTransfer.test.ts",
      "src/core/character/characterIntegrity.test.ts",
    ]),
    makeDomain("performance", "Performance and Bundle Health", [
      "src/core/performance/bundlePerformanceBudget-v5.142.test.ts",
      "src/core/rulesets/rulesetLoaderChunks.test.ts",
      "src/core/qa/mobileAccessibilityPerformance.test.ts",
      "src/core/quality/uiMobileAccessibilityPolish.test.ts",
    ]),
    makeDomain("offline", "Offline and PWA Recovery", [
      "src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts",
      "src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts",
      "release/ROLLBACK_PLAN_G_MEGA1.md",
    ]),
    makeDomain("journey", "Player Journey Regression", [
      "src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts",
      "src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts",
      "src/certification/player-readiness/contentExpansionCatalogClosure-F-MEGA2.test.ts",
      "src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts",
    ]),
    makeDomain("browser", "Operations Browser Smoke", [
      "e2e/production-operations-H-MEGA1.spec.ts",
    ]),
    makeDomain("ops-artifacts", "Operations Artifacts", [
      "release/PRODUCTION_OPERATIONS_CHECKLIST_H_MEGA1.md",
      "scripts/generate-production-health-snapshot-H-MEGA1.mjs",
    ]),
  ];

  const blockers = domains.flatMap((domain) =>
    domain.blockers.map((message) => `${domain.label}: ${message}`),
  );

  return {
    domains,
    blockers,
    summary: {
      totalDomains: domains.length,
      readyDomains: domains.filter((domain) => domain.status === "ready").length,
      blockedDomains: domains.filter((domain) => domain.status === "blocked").length,
      blockerCount: blockers.length,
    },
  };
}

function writeReports(manifest: ReturnType<typeof buildOperationsManifest>) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "H-MEGA1",
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "PRODUCTION_OPERATIONS_DIAGNOSTICS_H_MEGA1.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Production Operations & Diagnostics H-MEGA1",
    "",
    `- Ready domains: ${manifest.summary.readyDomains}/${manifest.summary.totalDomains}`,
    `- Blocked domains: ${manifest.summary.blockedDomains}/${manifest.summary.totalDomains}`,
    `- Blockers: ${manifest.summary.blockerCount}`,
    "",
  ];

  for (const domain of manifest.domains) {
    lines.push(
      `## ${domain.label}`,
      "",
      `- Status: **${domain.status.toUpperCase()}**`,
      `- Required artifacts: ${domain.requiredAll.length}`,
      "",
    );

    if (domain.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...domain.blockers.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(reportsDir, "PRODUCTION_OPERATIONS_DIAGNOSTICS_H_MEGA1.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("H-MEGA1 production operations and diagnostics", () => {
  const manifest = buildOperationsManifest();
  const report = writeReports(manifest);

  it("keeps every operations domain ready", () => {
    expect(report.summary.totalDomains).toBe(8);
    expect(report.summary.blockedDomains).toBe(0);
    expect(report.summary.blockerCount).toBe(0);
  });

  for (const domain of manifest.domains) {
    it(`${domain.label} is ready`, () => {
      expect(domain.status).toBe("ready");
      expect(domain.blockers).toEqual([]);
    });
  }
});
