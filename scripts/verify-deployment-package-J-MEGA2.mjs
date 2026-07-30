import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const manifestPath = path.join(
  projectRoot,
  "release",
  "DEPLOYMENT_MANIFEST_J_MEGA2.json",
);

if (!fs.existsSync(manifestPath)) {
  throw new Error("Deployment manifest missing.");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const deploymentRoot = path.join(projectRoot, manifest.deploymentFolder);

if (!fs.existsSync(deploymentRoot)) {
  throw new Error(`Deployment folder missing: ${deploymentRoot}`);
}

const failures = [];

for (const file of manifest.files) {
  const fullPath = path.join(deploymentRoot, file.path);

  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing file: ${file.path}`);
    continue;
  }

  const content = fs.readFileSync(fullPath);
  const sha256 = crypto.createHash("sha256").update(content).digest("hex");

  if (sha256 !== file.sha256) {
    failures.push(`Checksum mismatch: ${file.path}`);
  }

  if (content.length !== file.bytes) {
    failures.push(`Byte-size mismatch: ${file.path}`);
  }
}

if (failures.length > 0) {
  throw new Error(failures.join("\n"));
}

for (const required of ["index.html", "manifest.webmanifest", "sw.js"]) {
  if (!fs.existsSync(path.join(deploymentRoot, required))) {
    throw new Error(`Required deployment file missing: ${required}`);
  }
}

console.log(JSON.stringify({
  verified: true,
  fileCount: manifest.fileCount,
  deploymentFolder: manifest.deploymentFolder,
}, null, 2));
