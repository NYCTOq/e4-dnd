import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const releaseRoot = path.join(projectRoot, "release");

if (!fs.existsSync(distRoot)) {
  throw new Error(`dist directory not found: ${distRoot}`);
}

fs.mkdirSync(releaseRoot, { recursive: true });

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
  schemaVersion: "G-MEGA2",
  fileCount: files.length,
  totalBytes: files.reduce((total, file) => total + file.bytes, 0),
  files,
};

fs.writeFileSync(
  path.join(releaseRoot, "GOLDEN_RELEASE_ASSET_MANIFEST_G_MEGA2.json"),
  JSON.stringify(payload, null, 2),
  "utf8",
);

console.log(JSON.stringify({
  fileCount: payload.fileCount,
  totalBytes: payload.totalBytes,
  output: "release/GOLDEN_RELEASE_ASSET_MANIFEST_G_MEGA2.json",
}, null, 2));
