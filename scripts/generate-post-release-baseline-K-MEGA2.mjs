import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
);

const deploymentRoot = path.join(
  projectRoot,
  "deployment",
  "e4-dnd-6.2.0-public",
);

if (!fs.existsSync(deploymentRoot)) {
  throw new Error(`Public deployment folder missing: ${deploymentRoot}`);
}

const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const content = fs.readFileSync(fullPath);

    files.push({
      path: path.relative(deploymentRoot, fullPath).replace(/\\/g, "/"),
      bytes: content.length,
      sha256: crypto.createHash("sha256").update(content).digest("hex"),
    });
  }
}

walk(deploymentRoot);
files.sort((left, right) => left.path.localeCompare(right.path));

const baseline = {
  generatedAt: new Date().toISOString(),
  releaseId: "K-MEGA2",
  sourceReleaseId: packageJson.e4Release?.releaseId ?? null,
  version: packageJson.version,
  channel: packageJson.e4Release?.channel ?? null,
  saveSchemaVersion: packageJson.e4Release?.saveSchemaVersion ?? null,
  compatibilityFloor: packageJson.e4Release?.compatibilityFloor ?? null,
  gitTag: packageJson.e4Release?.gitTag ?? null,
  deploymentFolder: "deployment/e4-dnd-6.2.0-public",
  fileCount: files.length,
  totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  requiredShell: {
    index: fs.existsSync(path.join(deploymentRoot, "index.html")),
    manifest: fs.existsSync(path.join(deploymentRoot, "manifest.webmanifest")),
    serviceWorker: fs.existsSync(path.join(deploymentRoot, "sw.js")),
  },
  files,
};

fs.writeFileSync(
  path.join(projectRoot, "release", "POST_RELEASE_BASELINE_K_MEGA2.json"),
  JSON.stringify(baseline, null, 2),
  "utf8",
);

console.log(JSON.stringify({
  version: baseline.version,
  channel: baseline.channel,
  fileCount: baseline.fileCount,
  totalBytes: baseline.totalBytes,
  requiredShell: baseline.requiredShell,
}, null, 2));
