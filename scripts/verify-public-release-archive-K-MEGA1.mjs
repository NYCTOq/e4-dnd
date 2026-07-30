import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const manifestPath = path.join(projectRoot, "release", "PUBLIC_RELEASE_ARCHIVE_K_MEGA1.json");
if (!fs.existsSync(manifestPath)) throw new Error("Public release archive manifest missing.");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const deploymentRoot = path.join(projectRoot, manifest.deploymentFolder);
if (!fs.existsSync(deploymentRoot)) throw new Error("Public deployment folder missing.");

const failures = [];

for (const file of manifest.files) {
  const fullPath = path.join(deploymentRoot, file.path);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing file: ${file.path}`);
    continue;
  }

  const content = fs.readFileSync(fullPath);
  const sha256 = crypto.createHash("sha256").update(content).digest("hex");

  if (sha256 !== file.sha256) failures.push(`Checksum mismatch: ${file.path}`);
  if (content.length !== file.bytes) failures.push(`Byte-size mismatch: ${file.path}`);
}

for (const required of ["index.html", "manifest.webmanifest", "sw.js"]) {
  if (!fs.existsSync(path.join(deploymentRoot, required))) {
    failures.push(`Required file missing: ${required}`);
  }
}

if (manifest.version !== "6.2.0") failures.push("Version mismatch.");
if (manifest.channel !== "public-release") failures.push("Channel mismatch.");
if (manifest.gitTag !== "v6.2.0") failures.push("Git tag mismatch.");

if (failures.length > 0) throw new Error(failures.join("\n"));

console.log(JSON.stringify({
  verified: true,
  version: manifest.version,
  channel: manifest.channel,
  fileCount: manifest.fileCount
}, null, 2));
