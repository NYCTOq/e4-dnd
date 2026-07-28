import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = String(pkg.version || "").trim();
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) throw new Error(`Invalid package version: ${version}`);

const dist = path.join(root, "dist");
const releaseRoot = path.join(root, "release");
const releaseName = `E4_DND_v${version}`;
const output = path.join(releaseRoot, releaseName);
const appDir = path.join(output, "app");

async function exists(file) {
  try { await stat(file); return true; } catch { return false; }
}
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}
async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

const required = ["index.html", "manifest.webmanifest", "sw.js"];
for (const item of required) {
  if (!(await exists(path.join(dist, item)))) throw new Error(`Release input missing: dist/${item}`);
}
const assetDir = path.join(dist, "assets");
if (!(await exists(assetDir)) || (await walk(assetDir)).length === 0) throw new Error("Release input missing: dist/assets is empty");

await mkdir(releaseRoot, { recursive: true });
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(dist, appDir, { recursive: true });

const docs = [
  ["README.md", "README.md"],
  ["SRD_ATTRIBUTION.md", "SRD_ATTRIBUTION.md"],
  ["docs/release/CHANGELOG_v5.144.md", "CHANGELOG.md"],
  ["docs/release/RELEASE_CHECKLIST_v5.144.md", "RELEASE_CHECKLIST.md"],
];
const copiedDocs = [];
for (const [sourceRelative, targetName] of docs) {
  const source = path.join(root, sourceRelative);
  if (await exists(source)) {
    await cp(source, path.join(output, targetName));
    copiedDocs.push(targetName);
  }
}
if (!copiedDocs.includes("README.md") || !copiedDocs.includes("SRD_ATTRIBUTION.md")) {
  throw new Error("README.md and SRD_ATTRIBUTION.md are required for release packaging");
}

const files = (await walk(output)).sort();
const entries = [];
for (const file of files) {
  const relative = path.relative(output, file).split(path.sep).join("/");
  entries.push({ path: relative, bytes: (await stat(file)).size, sha256: await sha256(file) });
}
const totalBytes = entries.reduce((sum, item) => sum + item.bytes, 0);
const manifest = {
  schemaVersion: 1,
  product: "Everything for D&D",
  package: pkg.name,
  version,
  generatedAt: new Date().toISOString(),
  entryPoint: "app/index.html",
  pwa: { manifest: "app/manifest.webmanifest", serviceWorker: "app/sw.js" },
  documents: copiedDocs,
  fileCount: entries.length,
  totalBytes,
  files: entries,
};
await writeFile(path.join(output, "RELEASE_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

const finalFiles = (await walk(output)).sort();
const checksums = [];
for (const file of finalFiles) {
  const relative = path.relative(output, file).split(path.sep).join("/");
  if (relative === "SHA256SUMS.txt") continue;
  checksums.push(`${await sha256(file)}  ${relative}`);
}
await writeFile(path.join(output, "SHA256SUMS.txt"), checksums.join("\n") + "\n", "utf8");

const reportDir = path.join(root, "reports");
await mkdir(reportDir, { recursive: true });
await writeFile(path.join(reportDir, "RELEASE_PACKAGING_v5.144.json"), JSON.stringify({ releaseName, version, output, fileCount: finalFiles.length + 1, totalBytes }, null, 2) + "\n", "utf8");
await writeFile(path.join(reportDir, "RELEASE_PACKAGING_v5.144.md"), `# Release Packaging v5.144\n\n- Version: ${version}\n- Folder: release/${releaseName}\n- Files: ${finalFiles.length + 1}\n- Payload bytes: ${totalBytes}\n- Entry: app/index.html\n- PWA manifest: app/manifest.webmanifest\n- Service worker: app/sw.js\n- Checksums: SHA256SUMS.txt\n`, "utf8");
console.log(`Release folder generated: release/${releaseName}`);
console.log(`Files: ${finalFiles.length + 1}; payload: ${(totalBytes / 1024).toFixed(2)} KiB`);
