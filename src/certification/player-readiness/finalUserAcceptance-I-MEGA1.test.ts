import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type AcceptanceDomain = {
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
): AcceptanceDomain {
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

function buildAcceptanceManifest() {
  const domains = [
    makeDomain("journey", "Full Player Journey", [
      "src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts",
      "src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts",
      "src/certification/player-readiness/contentExpansionCatalogClosure-F-MEGA2.test.ts",
    ]),
    makeDomain("accessibility", "Accessibility and Mobile Quality", [
      "src/core/qa/mobileAccessibilityPerformance.test.ts",
      "src/core/quality/uiMobileAccessibilityPolish.test.ts",
      "src/certification/integration/navigationSearchUiFinalClosureContract.test.ts",
      "src/certification/integration/characterHubUiFinalClosureContract.test.ts",
    ]),
    makeDomain("navigation", "Navigation and Search", [
      "src/features/search/globalSearch.test.ts",
      "src/certification/discovery/navigationSearchDiscovery.test.ts",
      "src/certification/differential/navigationSearchRouteParity.test.ts",
      "src/certification/integration/navigationSearchGoldenIntentContract.test.ts",
    ]),
    makeDomain("builder-play", "Builder, Sheet and Play Mode", [
      "src/core/character/sheetPlayModeConsistency.test.ts",
      "src/core/character/playReadiness.test.ts",
      "src/core/rulesets/fullCharacterCertification.integration.test.ts",
      "src/certification/integration/characterHubActionabilityContract.test.ts",
    ]),
    makeDomain("persistence", "Persistence and Recovery", [
      "src/core/storage/characterHydration.test.ts",
      "src/features/backup/backupRecovery.test.ts",
      "src/features/backup/fullBackup.test.ts",
      "src/features/characters/characterTransfer.test.ts",
    ]),
    makeDomain("release", "Release and Operations", [
      "src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts",
      "src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts",
      "src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts",
      "src/core/release/finalReleaseGate.test.ts",
    ]),
    makeDomain("browser", "Browser Device Matrix", [
      "e2e/final-user-acceptance-I-MEGA1.spec.ts",
    ]),
    makeDomain("acceptance-artifacts", "Acceptance Artifacts", [
      "release/FINAL_USER_ACCEPTANCE_CHECKLIST_I_MEGA1.md",
      "scripts/generate-user-acceptance-snapshot-I-MEGA1.mjs",
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

function writeReports(manifest: ReturnType<typeof buildAcceptanceManifest>) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "I-MEGA1",
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "FINAL_USER_ACCEPTANCE_I_MEGA1.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Final User Acceptance I-MEGA1",
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
    path.join(reportsDir, "FINAL_USER_ACCEPTANCE_I_MEGA1.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("I-MEGA1 final user acceptance", () => {
  const manifest = buildAcceptanceManifest();
  const report = writeReports(manifest);

  it("keeps every user acceptance domain ready", () => {
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
