import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const packagePath = path.join(projectRoot, "package.json");

if (!fs.existsSync(packagePath)) {
  throw new Error(`package.json not found: ${packagePath}`);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const previousVersion = packageJson.version ?? null;
const targetVersion = "6.2.0";

packageJson.version = targetVersion;
packageJson.e4Release = {
  channel: "release-candidate",
  releaseId: "J-MEGA1",
  saveSchemaVersion: 2,
  compatibilityFloor: "6.1.0",
};

fs.writeFileSync(
  packagePath,
  `${JSON.stringify(packageJson, null, 2)}\n`,
  "utf8",
);

const releaseRoot = path.join(projectRoot, "release");
fs.mkdirSync(releaseRoot, { recursive: true });

const metadata = {
  generatedAt: new Date().toISOString(),
  releaseId: "J-MEGA1",
  channel: "release-candidate",
  previousVersion,
  version: targetVersion,
  saveSchemaVersion: 2,
  compatibilityFloor: "6.1.0",
  gitTag: `v${targetVersion}-rc.1`,
};

fs.writeFileSync(
  path.join(releaseRoot, "RELEASE_CANDIDATE_METADATA_J_MEGA1.json"),
  JSON.stringify(metadata, null, 2),
  "utf8",
);

console.log(JSON.stringify(metadata, null, 2));
