import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const deploymentRoot = path.join(projectRoot, "deployment", "e4-dnd-6.2.0-public");
const releaseRoot = path.join(projectRoot, "release");

if (!fs.existsSync(distRoot)) throw new Error("dist directory missing.");

fs.rmSync(deploymentRoot, { recursive: true, force: true });
fs.mkdirSync(deploymentRoot, { recursive: true });
fs.cpSync(distRoot, deploymentRoot, { recursive: true, force: true });

const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else {
      const content = fs.readFileSync(fullPath);
      files.push({
        path: path.relative(deploymentRoot, fullPath).replace(/\\/g, "/"),
        bytes: content.length,
        sha256: crypto.createHash("sha256").update(content).digest("hex"),
      });
    }
  }
}
walk(deploymentRoot);
files.sort((a, b) => a.path.localeCompare(b.path));

const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
);

const payload = {
  generatedAt: new Date().toISOString(),
  releaseId: "K-MEGA1",
  version: packageJson.version,
  channel: packageJson.e4Release?.channel ?? null,
  saveSchemaVersion: packageJson.e4Release?.saveSchemaVersion ?? null,
  gitTag: packageJson.e4Release?.gitTag ?? null,
  deploymentFolder: "deployment/e4-dnd-6.2.0-public",
  fileCount: files.length,
  totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  files
};

fs.writeFileSync(
  path.join(releaseRoot, "PUBLIC_RELEASE_ARCHIVE_K_MEGA1.json"),
  JSON.stringify(payload, null, 2),
  "utf8"
);

console.log(JSON.stringify({
  version: payload.version,
  channel: payload.channel,
  deploymentFolder: payload.deploymentFolder,
  fileCount: payload.fileCount,
  totalBytes: payload.totalBytes
}, null, 2));
