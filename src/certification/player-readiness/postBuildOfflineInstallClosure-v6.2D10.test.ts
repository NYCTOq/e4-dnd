import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type SmokeCheck = {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
};

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function findFirstExisting(relativePaths: string[]): string | null {
  return (
    relativePaths.find((relativePath) => exists(relativePath)) ?? null
  );
}

function buildPostBuildSmokeManifest() {
  const checks: SmokeCheck[] = [];

  const packagePath = path.join(projectRoot, "package.json");
  const packageJson = JSON.parse(
    fs.readFileSync(packagePath, "utf8"),
  ) as {
    name?: string;
    version?: string;
    scripts?: Record<string, string>;
  };

  checks.push({
    id: "package-build",
    label: "Package build command",
    ready: Boolean(packageJson.scripts?.build),
    detail: packageJson.scripts?.build ?? "missing build script",
  });

  checks.push({
    id: "vite-config",
    label: "Vite configuration",
    ready: exists("vite.config.ts") || exists("vite.config.js"),
    detail:
      findFirstExisting(["vite.config.ts", "vite.config.js"]) ??
      "missing Vite configuration",
  });

  const manifestPath = findFirstExisting([
    "public/manifest.webmanifest",
    "public/manifest.json",
    "src/manifest.webmanifest",
  ]);

  checks.push({
    id: "pwa-manifest",
    label: "PWA manifest source",
    ready: Boolean(manifestPath),
    detail: manifestPath ?? "manifest source missing",
  });

  const serviceWorkerPath = findFirstExisting([
    "public/sw.js",
    "public/service-worker.js",
    "src/registerSW.ts",
    "src/registerSW.tsx",
    "src/serviceWorker.ts",
    "src/serviceWorker.tsx",
    "vite.config.ts",
  ]);

  checks.push({
    id: "service-worker",
    label: "Service worker registration source",
    ready: Boolean(serviceWorkerPath),
    detail: serviceWorkerPath ?? "service worker source missing",
  });

  checks.push({
    id: "backup-recovery",
    label: "Backup and recovery coverage",
    ready:
      exists("src/features/backup/characterBackup.test.ts") &&
      exists("src/features/backup/fullBackup.test.ts") &&
      exists("src/features/backup/backupRecovery.test.ts"),
    detail: "character, full-backup and recovery suites",
  });

  checks.push({
    id: "route-fallback",
    label: "Navigation and route fallback coverage",
    ready:
      exists(
        "src/certification/differential/navigationSearchRouteParity.test.ts",
      ) &&
      exists(
        "src/certification/integration/navigationSearchRouteParityContract.test.ts",
      ),
    detail: "route parity and fallback contracts",
  });

  checks.push({
    id: "release-regression",
    label: "Distribution regression chain",
    ready:
      exists(
        "src/certification/player-readiness/releaseCandidateCertification-v6.2D8.test.ts",
      ) &&
      exists(
        "src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts",
      ),
    detail: "D8 and D9 release distribution regression",
  });

  const blockers = checks
    .filter((check) => !check.ready)
    .map((check) => `${check.label}: ${check.detail}`);

  return {
    package: {
      name: packageJson.name ?? null,
      version: packageJson.version ?? null,
    },
    checks,
    blockers,
    summary: {
      total: checks.length,
      ready: checks.filter((check) => check.ready).length,
      blocked: checks.filter((check) => !check.ready).length,
    },
  };
}

function inspectDistAfterBuild() {
  if (!fs.existsSync(distRoot)) {
    return {
      ready: false,
      blockers: ["dist directory missing"],
      files: [] as string[],
    };
  }

  const files: string[] = [];

  function walk(directory: string) {
    for (const entry of fs.readdirSync(directory, {
      withFileTypes: true,
    })) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(path.relative(distRoot, fullPath).replace(/\\/g, "/"));
      }
    }
  }

  walk(distRoot);

  const blockers: string[] = [];

  if (!files.includes("index.html")) {
    blockers.push("dist/index.html missing");
  }

  const hasAsset =
    files.some((file) => file.startsWith("assets/")) ||
    files.some((file) => /\.(js|css)$/.test(file));

  if (!hasAsset) {
    blockers.push("compiled JS/CSS assets missing");
  }

  const indexPath = path.join(distRoot, "index.html");
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, "utf8");

    if (!/<script/i.test(html)) {
      blockers.push("dist/index.html has no script reference");
    }
  }

  return {
    ready: blockers.length === 0,
    blockers,
    files,
  };
}

function writeReports(
  manifest: ReturnType<typeof buildPostBuildSmokeManifest>,
) {
  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "6.2D10",
    package: manifest.package,
    summary: manifest.summary,
    checks: manifest.checks,
    blockers: manifest.blockers,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "POST_BUILD_OFFLINE_INSTALL_CLOSURE_v6.2D10.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Post-Build Offline Install Closure v6.2D10",
    "",
    `- Package: ${manifest.package.name ?? "UNKNOWN"}`,
    `- Version: ${manifest.package.version ?? "UNKNOWN"}`,
    `- Ready checks: ${manifest.summary.ready}/${manifest.summary.total}`,
    `- Blocked checks: ${manifest.summary.blocked}/${manifest.summary.total}`,
    "",
  ];

  for (const check of manifest.checks) {
    lines.push(
      `## ${check.label}`,
      "",
      `- Status: **${check.ready ? "READY" : "BLOCKED"}**`,
      `- Detail: ${check.detail}`,
      "",
    );
  }

  if (manifest.blockers.length > 0) {
    lines.push("## Blockers", "");
    lines.push(...manifest.blockers.map((entry) => `- ${entry}`), "");
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "POST_BUILD_OFFLINE_INSTALL_CLOSURE_v6.2D10.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2D10 post-build offline install closure", () => {
  const manifest = buildPostBuildSmokeManifest();
  const report = writeReports(manifest);

  it("keeps every post-build source contract ready", () => {
    expect(report.summary.total).toBe(7);
    expect(report.summary.blocked).toBe(0);
    expect(report.blockers).toEqual([]);
  });

  it("has valid package identity", () => {
    expect(report.package.name).toBeTruthy();
    expect(report.package.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  for (const check of manifest.checks) {
    it(`${check.label} is ready`, () => {
      expect(check.ready).toBe(true);
    });
  }

  it("can inspect a generated dist when present", () => {
    if (!fs.existsSync(distRoot)) {
      expect(true).toBe(true);
      return;
    }

    const result = inspectDistAfterBuild();
    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
  });
});
