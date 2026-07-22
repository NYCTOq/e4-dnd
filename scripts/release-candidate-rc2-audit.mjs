import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];

async function exists(path) {
  try {
    await access(resolve(root, path));
    return true;
  } catch {
    return false;
  }
}

function check(condition, message) {
  console.log(`${condition ? "✓" : "✗"} ${message}`);
  if (!condition) failures.push(message);
}

const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const packageLock = JSON.parse(await readFile(resolve(root, "package-lock.json"), "utf8"));
const manifest = JSON.parse(
  await readFile(resolve(root, "release-candidate.manifest.json"), "utf8"),
);

check(packageJson.version === "5.103.0-rc.2", "package version is RC2.");
check(packageJson.version === manifest.version, "package and RC manifest versions match.");
check(packageLock.version === manifest.version, "package-lock version matches RC manifest.");
check(
  packageLock.packages?.[""]?.version === manifest.version,
  "root package-lock entry matches RC manifest.",
);
check(manifest.candidate === "RC2", "manifest candidate is RC2.");
check(
  Array.isArray(manifest.regressionFlows) && manifest.regressionFlows.length >= 6,
  "cross-feature regression matrix is registered.",
);

const requiredScripts = [
  "audit:technical-debt",
  "audit:rc2",
  "release:hash",
  "test:e2e:rc2",
  "verify:rc2",
  "lint",
  "test",
  "build",
];

for (const script of requiredScripts) {
  check(Boolean(packageJson.scripts?.[script]), `required script exists: ${script}`);
}

const requiredFiles = [
  "scripts/release-candidate-rc2-audit.mjs",
  "scripts/release-artifact-hash.mjs",
  "scripts/technical-debt-audit.mjs",
  "e2e/rc2-regression-matrix.spec.ts",
  "e2e/rc1-critical-smoke.spec.ts",
  "e2e/support/appState.ts",
  "RC2_REGRESSION_MATRIX.md",
  "RC2_RELEASE_CHECKLIST.md",
  "RC2_REGRESSION_PACKAGING_MEGA_v5.103.md",
];

for (const path of requiredFiles) {
  check(await exists(path), `required RC2 artifact exists: ${path}`);
}

if (failures.length > 0) {
  console.error(`\nRC2 audit failed with ${failures.length} blocker(s).`);
  process.exit(1);
}

console.log("\nRC2 audit passed. Candidate metadata and regression artifacts are consistent.");
