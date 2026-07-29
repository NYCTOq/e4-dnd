import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type CombatDomain = {
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

function makeDomain(id: string, label: string, requiredAll: string[]): CombatDomain {
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

function buildCombatSpellManifest() {
  const domains = [
    makeDomain("initiative-turns", "Initiative and Turn Flow", [
      "src/features/combat-tracker/combatTrackerStorage.test.ts",
      "src/features/combat-tracker/combatEncounterBridge.test.ts",
      "src/core/session/sessionPlayLoop-v5.134.test.ts",
    ]),
    makeDomain("conditions-reactions", "Conditions and Reactions", [
      "src/core/rulesets/combatAutomationRuntime.test.ts",
      "src/core/rulesets/spellControlOfficial.test.ts",
      "src/core/rulesets/spellEffectRules.test.ts",
      "src/features/combat-tracker/combatLogStorage.test.ts",
    ]),
    makeDomain("concentration-targeting", "Concentration and Targeting", [
      "src/core/rulesets/spellTargetRules.test.ts",
      "src/core/rulesets/spellBehaviorRules.test.ts",
      "src/core/rulesets/globalSpellRuntime.test.ts",
      "src/certification/integration/spellUiContract.test.ts",
    ]),
    makeDomain("auras-zones", "Auras, Movement and Battlefield Zones", [
      "src/core/rulesets/spellDefenseMovementOfficial.test.ts",
      "src/features/combat-tracker/battlefieldZones.test.ts",
      "src/certification/matrix/spellRuntimeCombatScenarioMatrix.test.ts",
    ]),
    makeDomain("summons-companions", "Summons and Companions", [
      "src/core/rulesets/spellSummonPersistentOfficial.test.ts",
      "src/core/rulesets/companionRules.test.ts",
      "src/certification/integration/runtimeEntityPersistenceBridge.test.ts",
      "src/certification/golden/runtimeEntityGoldenIntegration.test.ts",
    ]),
    makeDomain("upcasting-resources", "Upcasting, Resources and Rest", [
      "src/certification/player-readiness/spellcastingRuntimeMatrix-v6.2C5.test.ts",
      "src/core/rulesets/classFeatureRuntime.test.ts",
      "src/features/rest/restAutomation.test.ts",
      "src/certification/matrix/restRecoveryPersistenceMatrix.test.ts",
    ]),
    makeDomain("death-persistence", "Death Saves and Combat Persistence", [
      "src/certification/integration/deathDyingPlayModeIntegration.test.ts",
      "src/certification/matrix/deathDyingCharacterPersistenceMatrix.test.ts",
      "src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts",
      "src/core/storage/characterHydration.test.ts",
    ]),
    makeDomain("browser", "Browser Combat Shell", [
      "e2e/combat-spell-automation-E-MEGA2.spec.ts",
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

function writeReports(manifest: ReturnType<typeof buildCombatSpellManifest>) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "E-MEGA2",
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "COMBAT_SPELL_AUTOMATION_E_MEGA2.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Combat & Spell Automation E-MEGA2",
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
    path.join(reportsDir, "COMBAT_SPELL_AUTOMATION_E_MEGA2.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("E-MEGA2 combat and spell automation manifest", () => {
  const manifest = buildCombatSpellManifest();
  const report = writeReports(manifest);

  it("keeps all combat and spell domains wired", () => {
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
