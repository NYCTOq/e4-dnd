import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];
const notices = [];

async function exists(path) {
  try {
    await access(resolve(root, path));
    return true;
  } catch {
    return false;
  }
}

const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const packageLock = JSON.parse(await readFile(resolve(root, "package-lock.json"), "utf8"));
const manifest = JSON.parse(
  await readFile(resolve(root, "release-candidate.manifest.json"), "utf8"),
);

function check(condition, message) {
  if (condition) console.log(`✓ ${message}`);
  else {
    console.log(`✗ ${message}`);
    failures.push(message);
  }
}

check(
  packageJson.version === manifest.version,
  "package.json version matches the RC manifest.",
);
check(
  packageLock.version === manifest.version,
  "package-lock.json version matches the RC manifest.",
);
check(
  packageLock.packages?.[""]?.version === manifest.version,
  "root package-lock entry matches the RC manifest.",
);
check(
  manifest.channel === "release-candidate" && manifest.candidate === "RC1",
  "manifest identifies release candidate RC1.",
);

const requiredScripts = [
  "audit:technical-debt",
  "audit:rc",
  "lint",
  "test",
  "build",
  "test:e2e:rc1",
  "verify:rc1",
];

for (const name of requiredScripts) {
  check(Boolean(packageJson.scripts?.[name]), `required script exists: ${name}`);
}

const requiredFiles = [
  "scripts/technical-debt-audit.mjs",
  "scripts/release-candidate-audit.mjs",
  "e2e/rc1-critical-smoke.spec.ts",
  "e2e/support/appState.ts",
  "release-candidate.manifest.json",
  "RC1_RELEASE_CANDIDATE_MEGA_v5.102.md",
];

for (const path of requiredFiles) {
  check(await exists(path), `required RC artifact exists: ${path}`);
}

const forbiddenVersionFragments = ["5.100.0", "5.101.0"];
const serializedPackage = JSON.stringify(packageJson);
for (const fragment of forbiddenVersionFragments) {
  if (serializedPackage.includes(`"version":"${fragment}"`)) {
    failures.push(`stale package version remains: ${fragment}`);
  }
}

if (manifest.criticalRoutes.length < 6) {
  failures.push("critical route coverage is incomplete.");
}

notices.push(`${manifest.criticalRoutes.length} critical routes are registered.`);
notices.push(`${manifest.includedMilestones.length} milestones are represented.`);

for (const notice of notices) console.log(`• ${notice}`);

if (failures.length > 0) {
  console.error(`\nRC1 audit failed with ${failures.length} blocker(s).`);
  process.exit(1);
}

console.log("\nRC1 audit passed. Candidate metadata and release artifacts are consistent.");
