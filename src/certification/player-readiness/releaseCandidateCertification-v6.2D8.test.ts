import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type ReleaseArtifact = {
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

function readPackageJson(): {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
} {
  const filePath = path.join(projectRoot, "package.json");

  if (!fs.existsSync(filePath)) {
    throw new Error(`package.json not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    name?: string;
    version?: string;
    scripts?: Record<string, string>;
  };
}

function makeArtifact(
  id: string,
  label: string,
  paths: string[],
): ReleaseArtifact {
  const missing = paths.filter((relativePath) => !exists(relativePath));

  return {
    id,
    label,
    paths,
    status: missing.length === 0 ? "ready" : "blocked",
    blockers: missing.map((relativePath) => `Missing: ${relativePath}`),
  };
}

function buildReleaseCandidateManifest() {
  const packageJson = readPackageJson();

  const artifacts = [
    makeArtifact("runtime-waves", "Runtime Automation Waves", [
      "src/certification/player-readiness/guidedRuntimeGapClosure-v6.2D1.test.ts",
      "src/certification/player-readiness/guidedFeatureAutomationWave1-v6.2D2.test.ts",
      "src/certification/player-readiness/battlefieldAutomationWave2-v6.2D3.test.ts",
      "src/certification/player-readiness/narrativeGuidanceWave3-v6.2D4.test.ts",
      "src/certification/player-readiness/unifiedRuntimeContractRegistry-v6.2D5.test.ts",
    ]),
    makeArtifact("playable-runtime", "Playable Runtime Closure", [
      "src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts",
      "src/certification/player-readiness/fullPlayerSessionE2EClosure-v6.2D7.test.ts",
    ]),
    makeArtifact("release-gates", "Release Gates", [
      "src/core/release/stablePlayerRelease.test.ts",
      "src/core/release/stableReleaseHardening.test.ts",
      "src/core/release/finalReleaseGate.test.ts",
      "src/core/release/publicReleaseReadiness-v6.test.ts",
      "src/core/release/releasePackaging-v5.144.test.ts",
      "src/core/release/postReleaseQa.test.ts",
    ]),
    makeArtifact("quality", "Quality and Performance", [
      "src/core/quality/releaseReadinessAudit.test.ts",
      "src/core/quality/uiMobileAccessibilityPolish.test.ts",
      "src/core/qa/mobileAccessibilityPerformance.test.ts",
      "src/core/performance/bundlePerformanceBudget-v5.142.test.ts",
      "src/core/rulesets/rulesetLoaderChunks.test.ts",
    ]),
    makeArtifact("recovery", "Backup and Recovery", [
      "src/features/backup/characterBackup.test.ts",
      "src/features/backup/fullBackup.test.ts",
      "src/features/backup/backupRecovery.test.ts",
      "src/features/characters/characterTransfer.test.ts",
      "src/core/storage/characterHydration.test.ts",
    ]),
    makeArtifact("player-shell", "Player Application Shell", [
      "src/certification/integration/characterHubUiFinalClosureContract.test.ts",
      "src/certification/integration/navigationSearchUiFinalClosureContract.test.ts",
      "src/certification/integration/crossDomainUiFinalClosureContract.test.ts",
      "src/core/character/playerJourneyConsistency.test.ts",
    ]),
  ];

  const blockers = artifacts.flatMap((artifact) =>
    artifact.blockers.map((message) => `${artifact.label}: ${message}`),
  );

  if (!packageJson.name) blockers.push("package name missing");
  if (!packageJson.version) blockers.push("package version missing");
  if (!packageJson.scripts?.test) blockers.push("test script missing");
  if (!packageJson.scripts?.build) blockers.push("build script missing");

  const ready = artifacts.filter(
    (artifact) => artifact.status === "ready",
  ).length;

  return {
    package: {
      name: packageJson.name ?? null,
      version: packageJson.version ?? null,
      hasTestScript: Boolean(packageJson.scripts?.test),
      hasBuildScript: Boolean(packageJson.scripts?.build),
    },
    artifacts,
    blockers,
    summary: {
      totalDomains: artifacts.length,
      readyDomains: ready,
      blockedDomains: artifacts.length - ready,
      blockerCount: blockers.length,
    },
  };
}

function writeReports(
  manifest: ReturnType<typeof buildReleaseCandidateManifest>,
) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "6.2D8",
    releaseCandidate: {
      name: manifest.package.name,
      version: manifest.package.version,
    },
    summary: manifest.summary,
    package: manifest.package,
    artifacts: manifest.artifacts,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "RELEASE_CANDIDATE_CERTIFICATION_v6.2D8.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Release Candidate Certification v6.2D8",
    "",
    `- Package: ${manifest.package.name ?? "UNKNOWN"}`,
    `- Version: ${manifest.package.version ?? "UNKNOWN"}`,
    `- Ready domains: ${manifest.summary.readyDomains}/${manifest.summary.totalDomains}`,
    `- Blocked domains: ${manifest.summary.blockedDomains}/${manifest.summary.totalDomains}`,
    `- Blockers: ${manifest.summary.blockerCount}`,
    "",
  ];

  for (const artifact of manifest.artifacts) {
    lines.push(
      `## ${artifact.label}`,
      "",
      `- Status: **${artifact.status.toUpperCase()}**`,
      `- Required artifacts: ${artifact.paths.length}`,
      "",
    );

    if (artifact.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...artifact.blockers.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "RELEASE_CANDIDATE_CERTIFICATION_v6.2D8.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2D8 release candidate certification", () => {
  const manifest = buildReleaseCandidateManifest();
  const report = writeReports(manifest);

  it("keeps every release-candidate domain ready", () => {
    expect(report.summary.totalDomains).toBe(6);
    expect(report.summary.blockedDomains).toBe(0);
    expect(report.summary.blockerCount).toBe(0);
  });

  it("has valid package identity and release scripts", () => {
    expect(report.package.name).toBeTruthy();
    expect(report.package.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(report.package.hasTestScript).toBe(true);
    expect(report.package.hasBuildScript).toBe(true);
  });

  for (const artifact of manifest.artifacts) {
    it(`${artifact.label} has every required release artifact`, () => {
      expect(artifact.status).toBe("ready");
      expect(artifact.blockers).toEqual([]);
    });
  }
});
