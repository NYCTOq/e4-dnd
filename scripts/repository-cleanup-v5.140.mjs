import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const archiveRoot = path.join(root, "docs", "archive", "legacy-release-artifacts");
const buckets = {
  "archive-script": path.join(archiveRoot, "apply-scripts"),
  "archive-doc": path.join(archiveRoot, "reports-and-notes"),
  "archive-manifest": path.join(archiveRoot, "manifests"),
};
const keep = new Set(["README.md","CI.md","TESTING.md","DEPLOYMENT.md","RELEASES.md","SRD_ATTRIBUTION.md","LICENSE","package.json","package-lock.json","vite.config.ts","playwright.config.ts","tsconfig.json","tsconfig.app.json","tsconfig.node.json","index.html","APPLY_TEST_REPOSITORY_CLEANUP_v5.140.ps1"]);
function classify(name) {
  if (keep.has(name)) return "keep";
  if (/^APPLY_.+\.ps1$/i.test(name)) return "archive-script";
  if (/^(manifest|PACKAGE_MANIFEST|release-artifact-checksums).+\.json$/i.test(name)) return "archive-manifest";
  if (/\.(md|csv|txt)$/i.test(name) && /(v5\.|CERTIFICATION|HOTFIX|MATRIX|REPORT|MEGA|READINESS|FIX|UYGULAMA_ADIMLARI|DEGISTIRILEN_DOSYALAR)/i.test(name)) return "archive-doc";
  return "keep";
}
for (const dir of Object.values(buckets)) fs.mkdirSync(dir, { recursive: true });
const moved = [];
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const bucket = classify(entry.name);
  if (bucket === "keep") continue;
  const source = path.join(root, entry.name);
  const target = path.join(buckets[bucket], entry.name);
  if (path.resolve(source) === path.resolve(target)) continue;
  if (fs.existsSync(target)) fs.rmSync(target, { force: true });
  fs.renameSync(source, target);
  moved.push({ file: entry.name, bucket });
}
const index = [
  "# Legacy Release Artifact Archive",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Moved artifacts: ${moved.length}`,
  "",
  ...moved.sort((a,b)=>a.file.localeCompare(b.file)).map(x => `- \`${x.file}\` → ${x.bucket}`),
  "",
].join("\n");
fs.writeFileSync(path.join(archiveRoot, "ARCHIVE_INDEX.md"), index, "utf8");
fs.writeFileSync(path.join(root, "reports", "REPOSITORY_CLEANUP_v5.140.json"), JSON.stringify({ generatedAt:new Date().toISOString(), movedCount:moved.length, moved }, null, 2)+"\n", "utf8");
console.log(`Archived ${moved.length} legacy root artifacts.`);
