import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type ReadinessCheck = {
  id: string;
  label: string;
  paths: string[];
  status: "ready" | "blocked";
  blockers: string[];
};

const projectRoot = process.cwd();

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function makeCheck(
  id: string,
  label: string,
  paths: string[],
): ReadinessCheck {
  const missing = paths.filter((relativePath) => !exists(relativePath));

  return {
    id,
    label,
    paths,
    status: missing.length === 0 ? "ready" : "blocked",
    blockers: missing.map((relativePath) => `Missing: ${relativePath}`),
  };
}

function buildReadinessChecks(): ReadinessCheck[] {
  return [
    makeCheck("character-hub", "Character Hub", [
      "src/certification/golden/characterHubGoldenIntegration.test.ts",
      "src/certification/integration/characterHubGoldenIntegrationContract.test.ts",
      "src/certification/integration/characterHubActionabilityContract.test.ts",
      "src/certification/integration/characterHubUiFinalClosureContract.test.ts",
    ]),
    makeCheck("navigation-search", "Navigation and Search", [
      "src/certification/discovery/navigationSearchDiscovery.test.ts",
      "src/certification/integration/navigationSearchDiscoveryContract.test.ts",
      "src/certification/differential/navigationSearchRouteParity.test.ts",
      "src/certification/integration/navigationSearchUiFinalClosureContract.test.ts",
      "src/certification/golden/navigationSearchGoldenIntentIntegration.test.ts",
    ]),
    makeCheck("backup-transfer", "Backup and Character Transfer", [
      "src/features/backup/characterBackup.test.ts",
      "src/features/backup/fullBackup.test.ts",
      "src/features/backup/backupRecovery.test.ts",
      "src/features/characters/characterTransfer.test.ts",
      "src/core/storage/characterHydration.test.ts",
    ]),
    makeCheck("onboarding-accessibility", "Onboarding and Accessibility", [
      "src/core/onboarding/onboardingProgress-v5.143.test.ts",
      "src/core/quality/uiMobileAccessibilityPolish.test.ts",
      "src/core/qa/mobileAccessibilityPerformance.test.ts",
    ]),
    makeCheck("performance", "Performance and Bundle Budget", [
      "src/core/performance/bundlePerformanceBudget-v5.142.test.ts",
      "src/core/rulesets/rulesetLoaderChunks.test.ts",
    ]),
    makeCheck("release-gates", "Release Gates", [
      "src/core/release/stablePlayerRelease.test.ts",
      "src/core/release/stableReleaseHardening.test.ts",
      "src/core/release/finalReleaseGate.test.ts",
      "src/core/release/releasePackaging-v5.144.test.ts",
      "src/core/release/postReleaseQa.test.ts",
      "src/core/quality/releaseReadinessAudit.test.ts",
    ]),
    makeCheck("player-journey", "Player Journey", [
      "src/core/character/playerJourneyConsistency.test.ts",
      "src/core/character/playReadiness.test.ts",
      "src/core/character/characterLifecycle.integration.test.ts",
      "src/core/rulesets/fullCharacterCertification.integration.test.ts",
    ]),
    makeCheck("cross-domain", "Cross-Domain Closure", [
      "src/certification/discovery/crossDomainIntegrityDiscovery.test.ts",
      "src/certification/integration/crossDomainIntegrityContract.test.ts",
      "src/certification/golden/crossDomainGoldenPlayerLifecycle.test.ts",
      "src/certification/integration/crossDomainUiFinalClosureContract.test.ts",
    ]),
  ];
}

function writeReports(checks: ReadinessCheck[]) {
  const ready = checks.filter((check) => check.status === "ready").length;
  const blocked = checks.length - ready;
  const reportsDir = path.join(projectRoot, "reports");

  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    scope: {
      domains: checks.map((check) => check.label),
      expectedDomains: 8,
      requiredTestArtifacts: checks.reduce(
        (sum, check) => sum + check.paths.length,
        0,
      ),
    },
    summary: {
      ready,
      blocked,
      total: checks.length,
    },
    checks,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "PLAYER_EXPERIENCE_RELEASE_MATRIX_v6.2C9.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Player Experience and Release Matrix v6.2C9",
    "",
    `- Ready domains: ${ready}/${checks.length}`,
    `- Blocked domains: ${blocked}/${checks.length}`,
    `- Required test artifacts: ${payload.scope.requiredTestArtifacts}`,
    "",
  ];

  for (const check of checks) {
    lines.push(
      `## ${check.label}`,
      "",
      `- Status: **${check.status.toUpperCase()}**`,
      `- Required artifacts: ${check.paths.length}`,
      "",
    );

    if (check.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...check.blockers.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "PLAYER_EXPERIENCE_RELEASE_MATRIX_v6.2C9.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C9 player experience and release matrix", () => {
  const checks = buildReadinessChecks();
  const report = writeReports(checks);

  it("covers all eight player experience and release domains", () => {
    expect(report.summary.total).toBe(8);
    expect(report.summary.blocked).toBe(0);
  });

  for (const check of checks) {
    it(`${check.label} has every required certification artifact`, () => {
      expect(check.status).toBe("ready");
      expect(check.blockers).toEqual([]);
    });
  }
});
