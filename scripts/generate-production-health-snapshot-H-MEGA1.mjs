import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const releaseRoot = path.join(projectRoot, "release");
const reportsRoot = path.join(projectRoot, "reports");

if (!fs.existsSync(distRoot)) {
  throw new Error(`dist directory not found: ${distRoot}`);
}

fs.mkdirSync(releaseRoot, { recursive: true });

const distFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else {
      distFiles.push(path.relative(distRoot, fullPath).replace(/\\/g, "/"));
    }
  }
}
walk(distRoot);

const snapshot = {
  generatedAt: new Date().toISOString(),
  schemaVersion: "H-MEGA1",
  dist: {
    fileCount: distFiles.length,
    hasIndex: distFiles.includes("index.html"),
    hasManifest: distFiles.includes("manifest.webmanifest"),
    hasServiceWorker: distFiles.includes("sw.js"),
  },
  releaseArtifacts: fs.existsSync(releaseRoot)
    ? fs.readdirSync(releaseRoot).sort()
    : [],
  reports: fs.existsSync(reportsRoot)
    ? fs.readdirSync(reportsRoot).filter((file) => /H_MEGA1/.test(file)).sort()
    : [],
};

fs.writeFileSync(
  path.join(releaseRoot, "PRODUCTION_HEALTH_SNAPSHOT_H_MEGA1.json"),
  JSON.stringify(snapshot, null, 2),
  "utf8",
);

console.log(JSON.stringify(snapshot, null, 2));
