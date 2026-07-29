import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const releaseRoot = path.join(projectRoot, "release");
const packagePath = path.join(projectRoot, "package.json");

if (!fs.existsSync(distRoot)) {
  throw new Error(`dist directory missing: ${distRoot}`);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
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
      path: path.relative(distRoot, fullPath).replace(/\\/g, "/"),
      bytes: content.length,
      sha256: crypto.createHash("sha256").update(content).digest("hex"),
    });
  }
}

walk(distRoot);
files.sort((left, right) => left.path.localeCompare(right.path));

const payload = {
  generatedAt: new Date().toISOString(),
  releaseId: "J-MEGA1",
  version: packageJson.version,
  channel: packageJson.e4Release?.channel ?? "unknown",
  saveSchemaVersion: packageJson.e4Release?.saveSchemaVersion ?? null,
  gitTag: `v${packageJson.version}-rc.1`,
  fileCount: files.length,
  totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  files,
};

fs.writeFileSync(
  path.join(releaseRoot, "RELEASE_CANDIDATE_BUNDLE_J_MEGA1.json"),
  JSON.stringify(payload, null, 2),
  "utf8",
);

console.log(JSON.stringify({
  version: payload.version,
  gitTag: payload.gitTag,
  fileCount: payload.fileCount,
  totalBytes: payload.totalBytes,
}, null, 2));
