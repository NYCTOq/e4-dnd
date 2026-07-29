import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type DistributionCheck = {
  id: string;
  label: string;
  requiredAny?: string[];
  requiredAll?: string[];
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
  options: {
    requiredAny?: string[];
    requiredAll?: string[];
  },
): DistributionCheck {
  const requiredAll = options.requiredAll ?? [];
  const requiredAny = options.requiredAny ?? [];
  const blockers: string[] = [];

  for (const relativePath of requiredAll) {
    if (!exists(relativePath)) {
      blockers.push(`Missing required artifact: ${relativePath}`);
    }
  }

  if (
    requiredAny.length > 0 &&
    !requiredAny.some((relativePath) => exists(relativePath))
  ) {
    blockers.push(
      `Missing at least one required alternative: ${requiredAny.join(", ")}`,
    );
  }

  return {
    id,
    label,
    requiredAll,
    requiredAny,
    status: blockers.length === 0 ? "ready" : "blocked",
    blockers,
  };
}

function buildDistributionManifest() {
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

  const checks = [
    makeCheck("web-entry", "Web Application Entry", {
      requiredAll: [
        "index.html",
        "src",
        "public",
      ],
    }),
    makeCheck("pwa-shell", "PWA Shell", {
      requiredAny: [
        "public/manifest.webmanifest",
        "public/manifest.json",
        "src/manifest.webmanifest",
      ],
      requiredAll: [],
    }),
    makeCheck("service-worker", "Service Worker Registration", {
      requiredAny: [
        "public/sw.js",
        "public/service-worker.js",
        "src/registerSW.ts",
        "src/registerSW.tsx",
        "src/serviceWorker.ts",
        "src/serviceWorker.tsx",
        "vite.config.ts",
      ],
    }),
    makeCheck("release-tests", "Release Certification", {
      requiredAll: [
        "src/core/release/stablePlayerRelease.test.ts",
        "src/core/release/stableReleaseHardening.test.ts",
        "src/core/release/finalReleaseGate.test.ts",
        "src/core/release/publicReleaseReadiness-v6.test.ts",
        "src/core/release/releasePackaging-v5.144.test.ts",
        "src/certification/player-readiness/releaseCandidateCertification-v6.2D8.test.ts",
      ],
    }),
    makeCheck("offline-recovery", "Offline Recovery and Backup", {
      requiredAll: [
        "src/features/backup/characterBackup.test.ts",
        "src/features/backup/fullBackup.test.ts",
        "src/features/backup/backupRecovery.test.ts",
        "src/features/characters/characterTransfer.test.ts",
        "src/core/storage/characterHydration.test.ts",
      ],
    }),
    makeCheck("performance", "Distribution Performance", {
      requiredAll: [
        "src/core/performance/bundlePerformanceBudget-v5.142.test.ts",
        "src/core/rulesets/rulesetLoaderChunks.test.ts",
        "src/core/qa/mobileAccessibilityPerformance.test.ts",
      ],
    }),
  ];

  const blockers = checks.flatMap((check) =>
    check.blockers.map((message) => `${check.label}: ${message}`),
  );

  if (!packageJson.name) blockers.push("package name missing");
  if (!packageJson.version) blockers.push("package version missing");
  if (!packageJson.scripts?.build) blockers.push("build script missing");
  if (!packageJson.scripts?.test) blockers.push("test script missing");

  return {
    package: {
      name: packageJson.name ?? null,
      version: packageJson.version ?? null,
      hasBuildScript: Boolean(packageJson.scripts?.build),
      hasTestScript: Boolean(packageJson.scripts?.test),
    },
    checks,
    blockers,
    summary: {
      total: checks.length,
      ready: checks.filter((check) => check.status === "ready").length,
      blocked: checks.filter((check) => check.status === "blocked").length,
      blockerCount: blockers.length,
    },
  };
}

function writeReports(
  manifest: ReturnType<typeof buildDistributionManifest>,
) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "6.2D9",
    package: manifest.package,
    summary: manifest.summary,
    checks: manifest.checks,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "PUBLIC_RELEASE_DISTRIBUTION_CLOSURE_v6.2D9.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Public Release Distribution Closure v6.2D9",
    "",
    `- Package: ${manifest.package.name ?? "UNKNOWN"}`,
    `- Version: ${manifest.package.version ?? "UNKNOWN"}`,
    `- Ready domains: ${manifest.summary.ready}/${manifest.summary.total}`,
    `- Blocked domains: ${manifest.summary.blocked}/${manifest.summary.total}`,
    `- Blockers: ${manifest.summary.blockerCount}`,
    "",
  ];

  for (const check of manifest.checks) {
    lines.push(
      `## ${check.label}`,
      "",
      `- Status: **${check.status.toUpperCase()}**`,
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
      "PUBLIC_RELEASE_DISTRIBUTION_CLOSURE_v6.2D9.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2D9 public release distribution closure", () => {
  const manifest = buildDistributionManifest();
  const report = writeReports(manifest);

  it("keeps every public-distribution domain ready", () => {
    expect(report.summary.total).toBe(6);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.blockerCount).toBe(0);
  });

  it("has valid package identity and build commands", () => {
    expect(report.package.name).toBeTruthy();
    expect(report.package.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(report.package.hasBuildScript).toBe(true);
    expect(report.package.hasTestScript).toBe(true);
  });

  for (const check of manifest.checks) {
    it(`${check.label} has every required distribution artifact`, () => {
      expect(check.status).toBe("ready");
      expect(check.blockers).toEqual([]);
    });
  }
});
