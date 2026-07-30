import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
);

const publicZip = path.join(
  projectRoot,
  "release",
  "E4_DND_6.2.0_PUBLIC.zip",
);
const publicHash = path.join(
  projectRoot,
  "release",
  "E4_DND_6.2.0_PUBLIC.sha256",
);
const baselinePath = path.join(
  projectRoot,
  "release",
  "POST_RELEASE_BASELINE_K_MEGA2.json",
);

for (const required of [publicZip, publicHash, baselinePath]) {
  if (!fs.existsSync(required)) {
    throw new Error(`Required launch artifact missing: ${required}`);
  }
}

const zipBytes = fs.readFileSync(publicZip);
const calculatedHash = crypto
  .createHash("sha256")
  .update(zipBytes)
  .digest("hex");

const recordedHash = fs
  .readFileSync(publicHash, "utf8")
  .trim()
  .split(/\s+/)[0]
  .replace(/^\uFEFF/, "");

if (calculatedHash !== recordedHash) {
  throw new Error("Public ZIP hash does not match the recorded SHA-256.");
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

const evidence = {
  generatedAt: new Date().toISOString(),
  releaseId: "L-MEGA1",
  sourceReleaseId: packageJson.e4Release?.releaseId ?? null,
  version: packageJson.version,
  channel: packageJson.e4Release?.channel ?? null,
  gitTag: packageJson.e4Release?.gitTag ?? null,
  saveSchemaVersion: packageJson.e4Release?.saveSchemaVersion ?? null,
  publicZip: {
    path: "release/E4_DND_6.2.0_PUBLIC.zip",
    bytes: zipBytes.length,
    sha256: calculatedHash,
  },
  postReleaseBaseline: {
    fileCount: baseline.fileCount,
    totalBytes: baseline.totalBytes,
    requiredShell: baseline.requiredShell,
  },
  hostingExamples: {
    apache: "deployment/hosting-examples/apache-spa-pwa.htaccess.example",
    nginx: "deployment/hosting-examples/nginx-spa-pwa.conf.example",
  },
  manualAcceptance: {
    windowsChrome: "pending-manual",
    windowsEdge: "pending-manual",
    androidChrome: "pending-manual",
    iosSafari: "pending-manual",
    installedPwaOnline: "pending-manual",
    installedPwaOffline: "pending-manual",
    deepRouteRefresh: "pending-manual",
    saveReloadPersistence: "pending-manual",
  },
};

fs.writeFileSync(
  path.join(projectRoot, "release", "LAUNCH_EVIDENCE_L_MEGA1.json"),
  JSON.stringify(evidence, null, 2),
  "utf8",
);

console.log(JSON.stringify({
  version: evidence.version,
  channel: evidence.channel,
  publicZipBytes: evidence.publicZip.bytes,
  publicZipSha256: evidence.publicZip.sha256,
  baselineFileCount: evidence.postReleaseBaseline.fileCount,
}, null, 2));
