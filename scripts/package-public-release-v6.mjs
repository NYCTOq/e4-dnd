import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
if (pkg.version !== "6.0.0") throw new Error(`Public release requires version 6.0.0; found ${pkg.version}`);

const exists = async (file) => { try { await stat(file); return true; } catch { return false; } };
const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
};
const sha256 = async (file) => createHash("sha256").update(await readFile(file)).digest("hex");

const dist = path.join(root, "dist");
for (const required of ["index.html", "manifest.webmanifest", "sw.js"]) {
  if (!(await exists(path.join(dist, required)))) throw new Error(`Missing public release artifact: dist/${required}`);
}
const assets = path.join(dist, "assets");
if (!(await exists(assets)) || (await walk(assets)).length === 0) throw new Error("dist/assets is missing or empty");

const releaseRoot = path.join(root, "release");
const releaseName = "E4_DND_v6.0.0_PUBLIC";
const output = path.join(releaseRoot, releaseName);
await mkdir(releaseRoot, { recursive: true });
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(dist, path.join(output, "app"), { recursive: true });

const docs = [
  ["README.md", "README.md"],
  ["SRD_ATTRIBUTION.md", "SRD_ATTRIBUTION.md"],
  ["docs/release/CHANGELOG_v6.0.0.md", "CHANGELOG.md"],
  ["docs/release/PUBLIC_RELEASE_CHECKLIST_v6.0.0.md", "PUBLIC_RELEASE_CHECKLIST.md"],
  ["docs/release/KNOWN_LIMITATIONS_v6.0.0.md", "KNOWN_LIMITATIONS.md"],
];
for (const [source, target] of docs) {
  const full = path.join(root, source);
  if (!(await exists(full))) throw new Error(`Required release document missing: ${source}`);
  await cp(full, path.join(output, target));
}

const filesBeforeManifest = (await walk(output)).sort();
const entries = [];
for (const file of filesBeforeManifest) {
  entries.push({
    path: path.relative(output, file).split(path.sep).join("/"),
    bytes: (await stat(file)).size,
    sha256: await sha256(file),
  });
}
const manifest = {
  schemaVersion: 1,
  product: "Everything for D&D",
  channel: "public-playable",
  version: "6.0.0",
  generatedAt: new Date().toISOString(),
  entryPoint: "app/index.html",
  installablePwa: true,
  fileCount: entries.length + 2,
  payloadBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
  files: entries,
};
await writeFile(path.join(output, "PUBLIC_RELEASE_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

const checksumFiles = (await walk(output)).sort();
const checksumLines = [];
for (const file of checksumFiles) {
  const relative = path.relative(output, file).split(path.sep).join("/");
  if (relative === "SHA256SUMS.txt") continue;
  checksumLines.push(`${await sha256(file)}  ${relative}`);
}
await writeFile(path.join(output, "SHA256SUMS.txt"), checksumLines.join("\n") + "\n", "utf8");

await mkdir(path.join(root, "reports"), { recursive: true });
const report = {
  releaseName,
  version: "6.0.0",
  folder: path.relative(root, output).split(path.sep).join("/"),
  files: (await walk(output)).length,
  generatedAt: new Date().toISOString(),
};
await writeFile(path.join(root, "reports", "FIRST_PUBLIC_PLAYABLE_RELEASE_v6.0.0.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
await writeFile(path.join(root, "reports", "FIRST_PUBLIC_PLAYABLE_RELEASE_v6.0.0.md"), `# First Public Playable Release v6.0.0\n\n- Status: READY FOR PUBLIC PLAYABLE DISTRIBUTION\n- Release folder: ${report.folder}\n- Files: ${report.files}\n- Entry point: app/index.html\n- PWA manifest: app/manifest.webmanifest\n- Service worker: app/sw.js\n- Integrity: SHA256SUMS.txt\n`, "utf8");
console.log(`Public release folder generated: release/${releaseName}`);
