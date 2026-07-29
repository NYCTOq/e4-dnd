import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type SupportDomain = {
  id: string;
  label: string;
  requiredAll: string[];
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
): SupportDomain {
  const blockers = requiredAll
    .filter((required) => !exists(required))
    .map((required) => `Missing required artifact: ${required}`);

  return {
    id,
    label,
    requiredAll,
    blockers,
    status: blockers.length === 0 ? "ready" : "blocked",
  };
}

function buildSupportManifest() {
  const domains = [
    makeDomain("operations", "Operations Baseline", [
      "src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts",
      "release/PRODUCTION_HEALTH_SNAPSHOT_H_MEGA1.json",
      "release/PRODUCTION_OPERATIONS_CHECKLIST_H_MEGA1.md",
    ]),
    makeDomain("recovery", "Recovery Drill", [
      "src/features/backup/characterBackup.test.ts",
      "src/features/backup/fullBackup.test.ts",
      "src/features/backup/backupRecovery.test.ts",
      "src/features/characters/characterTransfer.test.ts",
      "src/core/storage/characterHydration.test.ts",
    ]),
    makeDomain("integrity", "Character and Save Integrity", [
      "src/core/character/characterIntegrity.test.ts",
      "src/core/character/characterLifecycle.integration.test.ts",
      "src/core/character/playerJourneyConsistency.test.ts",
      "src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts",
    ]),
    makeDomain("release-support", "Release Support and History", [
      "src/core/release/postReleaseQa.test.ts",
      "src/core/release/stableReleaseHardening.test.ts",
      "src/core/release/finalReleaseGate.test.ts",
      "src/core/release/publicReleaseReadiness-v6.test.ts",
    ]),
    makeDomain("offline-update", "Offline and Update Recovery", [
      "src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts",
      "src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts",
      "src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts",
    ]),
    makeDomain("browser-support", "Browser Support Shell", [
      "e2e/support-recovery-maintenance-H-MEGA2.spec.ts",
    ]),
    makeDomain("maintenance", "Maintenance Tooling", [
      "scripts/generate-maintenance-snapshot-H-MEGA2.mjs",
      "release/MAINTENANCE_RUNBOOK_H_MEGA2.md",
      "release/USER_RECOVERY_CHECKLIST_H_MEGA2.md",
    ]),
    makeDomain("golden-regression", "Golden Release Regression", [
      "src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts",
      "src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts",
      "src/core/quality/releaseReadinessAudit.test.ts",
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

function writeReports(manifest: ReturnType<typeof buildSupportManifest>) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "H-MEGA2",
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "SUPPORT_RECOVERY_MAINTENANCE_H_MEGA2.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Support, Recovery & Maintenance H-MEGA2",
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
    path.join(reportsDir, "SUPPORT_RECOVERY_MAINTENANCE_H_MEGA2.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("H-MEGA2 support, recovery and maintenance closure", () => {
  const manifest = buildSupportManifest();
  const report = writeReports(manifest);

  it("keeps every support and recovery domain ready", () => {
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
