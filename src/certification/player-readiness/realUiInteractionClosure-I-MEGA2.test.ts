import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type InteractionDomain = {
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
): InteractionDomain {
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

function buildInteractionManifest() {
  const domains = [
    makeDomain("builder", "Builder Interaction", [
      "src/features/builder/builderGuidance.test.ts",
      "src/core/rulesets/unifiedCharacterChoices.test.ts",
      "src/core/rulesets/fullCharacterCertification.integration.test.ts",
    ]),
    makeDomain("choices", "Class, Subclass, Spell, Feat and Equipment Choices", [
      "src/certification/player-readiness/playerChoiceIntegrityMatrix-v6.2C2.test.ts",
      "src/core/rulesets/builderSpellIntegration.test.ts",
      "src/core/rulesets/featOfficialCertification.test.ts",
      "src/core/rulesets/itemUseRules.test.ts",
    ]),
    makeDomain("sheet-play", "Character Sheet and Play Mode", [
      "src/core/character/sheetPlayModeConsistency.test.ts",
      "src/core/character/playReadiness.test.ts",
      "src/certification/integration/characterHubActionabilityContract.test.ts",
    ]),
    makeDomain("combat-rest", "Combat, Rest and Death", [
      "src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts",
      "src/features/rest/restAutomation.test.ts",
      "src/certification/integration/deathDyingPlayModeIntegration.test.ts",
    ]),
    makeDomain("level-up", "Level Up and Persistence", [
      "src/certification/oracle/levelUpProgressionOracle.test.ts",
      "src/certification/integration/levelUpPersistenceBridge.test.ts",
      "src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts",
    ]),
    makeDomain("backup", "Backup, Transfer and Reload", [
      "src/features/backup/characterBackup.test.ts",
      "src/features/backup/fullBackup.test.ts",
      "src/features/backup/backupRecovery.test.ts",
      "src/features/characters/characterTransfer.test.ts",
      "src/core/storage/characterHydration.test.ts",
    ]),
    makeDomain("browser", "Real Browser Interaction Matrix", [
      "e2e/real-ui-interaction-I-MEGA2.spec.ts",
    ]),
    makeDomain("release", "Acceptance and Release Regression", [
      "src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts",
      "src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts",
      "src/core/release/finalReleaseGate.test.ts",
      "release/REAL_UI_INTERACTION_CHECKLIST_I_MEGA2.md",
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

function writeReports(manifest: ReturnType<typeof buildInteractionManifest>) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "I-MEGA2",
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "REAL_UI_INTERACTION_CLOSURE_I_MEGA2.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Real UI Interaction Closure I-MEGA2",
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
    path.join(reportsDir, "REAL_UI_INTERACTION_CLOSURE_I_MEGA2.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("I-MEGA2 real UI interaction closure", () => {
  const manifest = buildInteractionManifest();
  const report = writeReports(manifest);

  it("keeps every interaction domain ready", () => {
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
