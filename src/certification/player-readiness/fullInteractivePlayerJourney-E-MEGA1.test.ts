import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type JourneyDomain = {
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
): JourneyDomain {
  const blockers: string[] = [];

  for (const required of requiredAll) {
    if (!exists(required)) {
      blockers.push(`Missing required artifact: ${required}`);
    }
  }

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

function buildInteractiveJourneyManifest() {
  const packagePath = path.join(projectRoot, "package.json");

  if (!fs.existsSync(packagePath)) {
    throw new Error(`package.json not found: ${packagePath}`);
  }

  const packageJson = JSON.parse(
    fs.readFileSync(packagePath, "utf8"),
  ) as {
    name?: string;
    version?: string;
    scripts?: Record<string, string>;
  };

  const domains = [
    makeDomain("creation", "Character Creation", [
      "src/certification/player-readiness/allClassCharacterCreationMatrix-v6.2C1.test.ts",
      "src/certification/player-readiness/playerChoiceIntegrityMatrix-v6.2C2.test.ts",
      "src/core/character/characterLifecycle.integration.test.ts",
    ]),
    makeDomain("sheet-play", "Character Sheet and Play Mode", [
      "src/core/character/sheetPlayModeConsistency.test.ts",
      "src/core/character/playReadiness.test.ts",
      "src/core/rulesets/characterSheetCertification.test.ts",
      "src/certification/integration/classSubclassUiContract.test.ts",
    ]),
    makeDomain("combat-rest", "Combat, Rest and Recovery", [
      "src/certification/player-readiness/combatSurvivalEquipmentMatrix-v6.2C4.test.ts",
      "src/features/rest/restAutomation.test.ts",
      "src/features/rest/restSheetPlayIntegration.test.ts",
      "src/certification/integration/deathDyingPlayModeIntegration.test.ts",
    ]),
    makeDomain("level-up", "Level Up and Multiclass", [
      "src/certification/player-readiness/multiclassRuntimeMatrix-v6.2C8.test.ts",
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
    makeDomain(
      "browser-shell",
      "Browser and PWA Shell",
      [
        "e2e/full-interactive-player-journey-E-MEGA1.spec.ts",
      ],
      [
        "playwright.config.ts",
        "playwright.config.js",
        "playwright.config.mts",
        "playwright.config.mjs",
      ],
    ),
    makeDomain("release", "Release and Distribution Regression", [
      "src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts",
      "src/certification/player-readiness/fullPlayerSessionE2EClosure-v6.2D7.test.ts",
      "src/certification/player-readiness/releaseCandidateCertification-v6.2D8.test.ts",
      "src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts",
      "src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts",
    ]),
  ];

  const blockers = domains.flatMap((domain) =>
    domain.blockers.map((message) => `${domain.label}: ${message}`),
  );

  if (!packageJson.name) blockers.push("package name missing");
  if (!packageJson.version) blockers.push("package version missing");
  if (!packageJson.scripts?.test) blockers.push("test script missing");
  if (!packageJson.scripts?.build) blockers.push("build script missing");

  return {
    package: {
      name: packageJson.name ?? null,
      version: packageJson.version ?? null,
      hasTestScript: Boolean(packageJson.scripts?.test),
      hasBuildScript: Boolean(packageJson.scripts?.build),
    },
    domains,
    blockers,
    summary: {
      totalDomains: domains.length,
      readyDomains: domains.filter(
        (domain) => domain.status === "ready",
      ).length,
      blockedDomains: domains.filter(
        (domain) => domain.status === "blocked",
      ).length,
      blockerCount: blockers.length,
    },
  };
}

function writeReports(
  manifest: ReturnType<typeof buildInteractiveJourneyManifest>,
) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "E-MEGA1",
    package: manifest.package,
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "FULL_INTERACTIVE_PLAYER_JOURNEY_E_MEGA1.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Full Interactive Player Journey E-MEGA1",
    "",
    `- Package: ${manifest.package.name ?? "UNKNOWN"}`,
    `- Version: ${manifest.package.version ?? "UNKNOWN"}`,
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
    path.join(
      reportsDir,
      "FULL_INTERACTIVE_PLAYER_JOURNEY_E_MEGA1.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("E-MEGA1 full interactive player journey manifest", () => {
  const manifest = buildInteractiveJourneyManifest();
  const report = writeReports(manifest);

  it("keeps all major player-journey domains ready", () => {
    expect(report.summary.totalDomains).toBe(7);
    expect(report.summary.blockedDomains).toBe(0);
    expect(report.summary.blockerCount).toBe(0);
  });

  it("has valid package identity and lifecycle scripts", () => {
    expect(report.package.name).toBeTruthy();
    expect(report.package.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(report.package.hasTestScript).toBe(true);
    expect(report.package.hasBuildScript).toBe(true);
  });

  for (const domain of manifest.domains) {
    it(`${domain.label} is wired into the mega journey`, () => {
      expect(domain.status).toBe("ready");
      expect(domain.blockers).toEqual([]);
    });
  }
});
