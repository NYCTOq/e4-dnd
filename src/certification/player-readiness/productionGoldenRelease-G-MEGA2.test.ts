import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type ReleaseDomain = {
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
): ReleaseDomain {
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

function buildGoldenReleaseManifest() {
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
    makeDomain("mega-regression", "Mega Regression Chain", [
      "src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts",
      "src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts",
      "src/certification/player-readiness/contentAccuracyRulesetDifferential-F-MEGA1.test.ts",
      "src/certification/player-readiness/contentExpansionCatalogClosure-F-MEGA2.test.ts",
      "src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts",
    ]),
    makeDomain("release-gates", "Release Gates", [
      "src/core/release/stablePlayerRelease.test.ts",
      "src/core/release/stableReleaseHardening.test.ts",
      "src/core/release/finalReleaseGate.test.ts",
      "src/core/release/publicReleaseReadiness-v6.test.ts",
      "src/core/release/releasePackaging-v5.144.test.ts",
      "src/core/release/postReleaseQa.test.ts",
    ]),
    makeDomain("distribution", "Distribution and Offline Shell", [
      "src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts",
      "src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts",
      "src/core/performance/bundlePerformanceBudget-v5.142.test.ts",
      "src/core/rulesets/rulesetLoaderChunks.test.ts",
    ]),
    makeDomain("recovery", "Backup, Migration and Rollback", [
      "src/features/backup/characterBackup.test.ts",
      "src/features/backup/fullBackup.test.ts",
      "src/features/backup/backupRecovery.test.ts",
      "src/features/characters/characterTransfer.test.ts",
      "src/core/storage/characterHydration.test.ts",
      "release/ROLLBACK_PLAN_G_MEGA1.md",
    ]),
    makeDomain("browser", "Production Browser Smoke", [
      "e2e/production-golden-release-G-MEGA2.spec.ts",
    ]),
    makeDomain(
      "pwa",
      "PWA and Service Worker",
      [],
      [
        "vite.config.ts",
        "vite.config.js",
        "src/registerSW.ts",
        "src/registerSW.tsx",
        "src/serviceWorker.ts",
        "src/serviceWorker.tsx",
      ],
    ),
    makeDomain("release-meta", "Release Metadata", [
      "release/RELEASE_MANIFEST_G_MEGA1.json",
      "release/CHANGELOG_G_MEGA1.md",
      "release/ROLLBACK_PLAN_G_MEGA1.md",
      "release/GOLDEN_RELEASE_CHECKLIST_G_MEGA2.md",
    ]),
    makeDomain("bundle-script", "Bundle Manifest Tooling", [
      "scripts/generate-golden-release-manifest-G-MEGA2.mjs",
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

function writeReports(
  manifest: ReturnType<typeof buildGoldenReleaseManifest>,
) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "G-MEGA2",
    package: manifest.package,
    summary: manifest.summary,
    domains: manifest.domains,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(reportsDir, "PRODUCTION_GOLDEN_RELEASE_G_MEGA2.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Production Golden Release G-MEGA2",
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
    path.join(reportsDir, "PRODUCTION_GOLDEN_RELEASE_G_MEGA2.md"),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("G-MEGA2 production golden release closure", () => {
  const manifest = buildGoldenReleaseManifest();
  const report = writeReports(manifest);

  it("keeps every golden-release domain ready", () => {
    expect(report.summary.totalDomains).toBe(8);
    expect(report.summary.blockedDomains).toBe(0);
    expect(report.summary.blockerCount).toBe(0);
  });

  it("has valid package identity and release scripts", () => {
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
