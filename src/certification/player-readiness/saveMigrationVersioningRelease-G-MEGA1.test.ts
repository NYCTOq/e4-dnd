import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type MigrationDomain = {
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
): MigrationDomain {
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

function buildMigrationManifest() {
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
    makeDomain("hydration", "Save Hydration and Compatibility", [
      "src/core/storage/characterHydration.test.ts",
      "src/core/character/characterIntegrity.test.ts",
      "src/core/character/characterLifecycle.integration.test.ts",
    ]),
    makeDomain("backup", "Pre-Migration Backup and Recovery", [
      "src/features/backup/characterBackup.test.ts",
      "src/features/backup/fullBackup.test.ts",
      "src/features/backup/backupRecovery.test.ts",
      "src/features/characters/characterTransfer.test.ts",
    ]),
    makeDomain("persistence", "Cross-Version Persistence", [
      "src/certification/matrix/classSubclassPersistenceMatrix.test.ts",
      "src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts",
      "src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts",
      "src/certification/matrix/deathDyingCharacterPersistenceMatrix.test.ts",
      "src/certification/matrix/restRecoveryPersistenceMatrix.test.ts",
    ]),
    makeDomain("release", "Versioning and Release Gates", [
      "src/core/release/stablePlayerRelease.test.ts",
      "src/core/release/stableReleaseHardening.test.ts",
      "src/core/release/finalReleaseGate.test.ts",
      "src/core/release/publicReleaseReadiness-v6.test.ts",
      "src/core/release/releasePackaging-v5.144.test.ts",
      "src/core/release/postReleaseQa.test.ts",
    ]),
    makeDomain(
      "pwa-update",
      "PWA Update and Cache Strategy",
      [
        "src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts",
      ],
      [
        "vite.config.ts",
        "vite.config.js",
        "src/registerSW.ts",
        "src/registerSW.tsx",
        "src/serviceWorker.ts",
        "src/serviceWorker.tsx",
      ],
    ),
    makeDomain("rollback", "Rollback and Recovery Safety", [
      "src/features/backup/backupRecovery.test.ts",
      "src/core/release/stableReleaseHardening.test.ts",
      "src/core/release/postReleaseQa.test.ts",
    ]),
    makeDomain("browser", "Browser Migration Shell", [
      "e2e/save-migration-release-G-MEGA1.spec.ts",
    ]),
    makeDomain("release-artifacts", "Release Metadata Artifacts", [
      "release/RELEASE_MANIFEST_G_MEGA1.json",
      "release/CHANGELOG_G_MEGA1.md",
      "release/ROLLBACK_PLAN_G_MEGA1.md",
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
      readyDomains: domains.filter((domain) => domain.status === "ready").length,
      blockedDomains: domains.filter((domain) => domain.status === "blocked").length,
      blockerCount: blockers.length,
    },
  };
}

function writeReports(manifest: ReturnType<typeof buildMigrationManifest>) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "G-MEGA1",
    package: manifest.package,
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "SAVE_MIGRATION_VERSIONING_RELEASE_G_MEGA1.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Save Migration, Versioning & Release G-MEGA1",
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
    path.join(reportsDir, "SAVE_MIGRATION_VERSIONING_RELEASE_G_MEGA1.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("G-MEGA1 save migration, versioning and release closure", () => {
  const manifest = buildMigrationManifest();
  const report = writeReports(manifest);

  it("keeps every migration and release domain wired", () => {
    expect(report.summary.totalDomains).toBe(8);
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
    it(`${domain.label} is ready`, () => {
      expect(domain.status).toBe("ready");
      expect(domain.blockers).toEqual([]);
    });
  }
});
