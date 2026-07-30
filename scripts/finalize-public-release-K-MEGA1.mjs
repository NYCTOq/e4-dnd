import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const packagePath = path.join(projectRoot, "package.json");

if (!fs.existsSync(packagePath)) throw new Error("package.json not found.");

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const previousChannel = packageJson.e4Release?.channel ?? null;
const previousReleaseId = packageJson.e4Release?.releaseId ?? null;

packageJson.version = "6.2.0";
packageJson.e4Release = {
  channel: "public-release",
  releaseId: "K-MEGA1",
  saveSchemaVersion: 2,
  compatibilityFloor: "6.1.0",
  gitTag: "v6.2.0"
};

fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

const releaseRoot = path.join(projectRoot, "release");
fs.mkdirSync(releaseRoot, { recursive: true });

const metadata = {
  generatedAt: new Date().toISOString(),
  releaseId: "K-MEGA1",
  version: "6.2.0",
  channel: "public-release",
  saveSchemaVersion: 2,
  compatibilityFloor: "6.1.0",
  gitTag: "v6.2.0",
  previousChannel,
  previousReleaseId
};

fs.writeFileSync(
  path.join(releaseRoot, "PUBLIC_RELEASE_METADATA_K_MEGA1.json"),
  JSON.stringify(metadata, null, 2),
  "utf8"
);

console.log(JSON.stringify(metadata, null, 2));
