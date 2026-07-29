import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type AccuracyDomain = {
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
): AccuracyDomain {
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

function buildAccuracyManifest() {
  const domains = [
    makeDomain("class-progression", "Class Progression Accuracy", [
      "src/certification/oracle/levelUpProgressionOracle.test.ts",
      "src/certification/differential/levelUpProgressionDifferential.test.ts",
      "src/core/rulesets/martialOfficialProgression.test.ts",
      "src/core/rulesets/clericDruidOfficialProgression.test.ts",
      "src/core/rulesets/bardSorcererOfficialProgression.test.ts",
      "src/core/rulesets/warlockWizardOfficialProgression.test.ts",
      "src/core/rulesets/halfCasterOfficialProgression.test.ts",
    ]),
    makeDomain("subclass", "Subclass Progression Accuracy", [
      "src/core/rulesets/subclassExpansion.test.ts",
      "src/core/rulesets/subclassRuntimeRules.test.ts",
      "src/certification/matrix/classSubclassRuntimeScenarioMatrix.test.ts",
      "src/certification/differential/classSubclassRuntimeDifferential.test.ts",
      "src/certification/oracle/classSubclassRuntimeOracle.test.ts",
    ]),
    makeDomain("spellcasting", "Spellcasting Accuracy", [
      "src/certification/oracle/spellcastingOracle.test.ts",
      "src/certification/player-readiness/spellcastingRuntimeMatrix-v6.2C5.test.ts",
      "src/core/rulesets/spellBuilderOfficial.test.ts",
      "src/core/rulesets/spellRuntimeOfficial2024.test.ts",
      "src/core/rulesets/damageSaveSpellOfficial.test.ts",
      "src/core/rulesets/spellControlOfficial.test.ts",
      "src/core/rulesets/spellDefenseMovementOfficial.test.ts",
      "src/core/rulesets/spellSummonPersistentOfficial.test.ts",
    ]),
    makeDomain("feat-origin", "Feat and Origin Accuracy", [
      "src/core/rulesets/featOfficialCertification.test.ts",
      "src/core/rulesets/featCatalog2024Official.test.ts",
      "src/certification/player-readiness/originFeatRuntimeMatrix-v6.2C7.test.ts",
      "src/certification/oracle/classBackgroundOracle.test.ts",
      "src/core/rulesets/ancestryChoiceRules.test.ts",
    ]),
    makeDomain("multiclass", "Multiclass Accuracy", [
      "src/core/rulesets/multiclassOfficialCertification.test.ts",
      "src/core/rulesets/multiclassRules.test.ts",
      "src/core/rulesets/multiclassSpellcastingSeparation.test.ts",
      "src/core/rulesets/multiclassPactMagic.test.ts",
      "src/certification/player-readiness/multiclassRuntimeMatrix-v6.2C8.test.ts",
      "src/certification/oracle/advancedMulticlassOracle.test.ts",
      "src/certification/differential/advancedMulticlassDifferential.test.ts",
    ]),
    makeDomain("equipment-items", "Equipment and Magic Item Accuracy", [
      "src/certification/oracle/equipmentCombatOracle.test.ts",
      "src/certification/differential/equipmentCombatDifferential.test.ts",
      "src/certification/matrix/equipmentCombatScenarioMatrix.test.ts",
      "src/core/rulesets/magicItemRules.test.ts",
      "src/core/rulesets/itemEffectRuntimeRules.test.ts",
      "src/core/rulesets/equipmentMagicItemFinalCoverage.test.ts",
    ]),
    makeDomain("ruleset-differential", "2014 and 2024 Differential Accuracy", [
      "src/certification/differential/crossDomainBuilderRecordSheetDifferential.test.ts",
      "src/certification/differential/classSubclassRuntimeDifferential.test.ts",
      "src/certification/differential/spellRuntimeCombatDifferential.test.ts",
      "src/certification/differential/restRecoveryDifferential.test.ts",
      "src/certification/differential/deathDyingDifferential.test.ts",
      "src/certification/differential/runtimeCoverageDifferential.test.ts",
    ]),
    makeDomain("content-integrity", "Content Integrity and Release Audit", [
      "src/core/rulesets/contentIntegrityAudit.test.ts",
      "src/core/rulesets/contentIntegrityAudit.integration.test.ts",
      "src/core/rulesets/fullCharacterCertification.integration.test.ts",
      "src/core/rulesets/runtimeCoverageCertification.integration.test.ts",
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

function writeReports(manifest: ReturnType<typeof buildAccuracyManifest>) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "F-MEGA1",
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "CONTENT_ACCURACY_RULESET_DIFFERENTIAL_F_MEGA1.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Content Accuracy & Ruleset Differential F-MEGA1",
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
    path.join(reportsDir, "CONTENT_ACCURACY_RULESET_DIFFERENTIAL_F_MEGA1.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("F-MEGA1 content accuracy and ruleset differential", () => {
  const manifest = buildAccuracyManifest();
  const report = writeReports(manifest);

  it("keeps every accuracy domain wired", () => {
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
