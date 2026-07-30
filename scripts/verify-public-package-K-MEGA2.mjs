import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const baselinePath = path.join(
  projectRoot,
  "release",
  "POST_RELEASE_BASELINE_K_MEGA2.json",
);
const zipPath = path.join(
  projectRoot,
  "release",
  "E4_DND_6.2.0_PUBLIC.zip",
);
const hashPath = path.join(
  projectRoot,
  "release",
  "E4_DND_6.2.0_PUBLIC.sha256",
);

if (!fs.existsSync(baselinePath)) {
  throw new Error("Post-release baseline missing.");
}

if (!fs.existsSync(zipPath)) {
  throw new Error("Public release ZIP missing.");
}

if (!fs.existsSync(hashPath)) {
  throw new Error("Public release SHA-256 file missing.");
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const zipContent = fs.readFileSync(zipPath);
const actualHash = crypto
  .createHash("sha256")
  .update(zipContent)
  .digest("hex");

const expectedHash = fs.readFileSync(hashPath, "utf8").trim().split(/\s+/)[0];

const failures = [];

if (actualHash !== expectedHash) {
  failures.push("Public ZIP checksum mismatch.");
}

if (baseline.version !== "6.2.0") {
  failures.push("Public package version mismatch.");
}

if (baseline.channel !== "public-release") {
  failures.push("Public package channel mismatch.");
}

if (!baseline.requiredShell.index) failures.push("index.html missing.");
if (!baseline.requiredShell.manifest) failures.push("manifest.webmanifest missing.");
if (!baseline.requiredShell.serviceWorker) failures.push("sw.js missing.");

if (failures.length > 0) {
  throw new Error(failures.join("\n"));
}

console.log(JSON.stringify({
  verified: true,
  zip: "release/E4_DND_6.2.0_PUBLIC.zip",
  sha256: actualHash,
  bytes: zipContent.length,
  fileCount: baseline.fileCount,
}, null, 2));
