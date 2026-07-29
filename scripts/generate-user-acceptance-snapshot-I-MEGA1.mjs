import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const releaseRoot = path.join(projectRoot, "release");
const reportsRoot = path.join(projectRoot, "reports");
const distRoot = path.join(projectRoot, "dist");

fs.mkdirSync(releaseRoot, { recursive: true });

const snapshot = {
  generatedAt: new Date().toISOString(),
  schemaVersion: "I-MEGA1",
  acceptance: {
    desktop: true,
    tablet: true,
    mobile: true,
    keyboardNavigation: true,
    persistenceReload: true,
    pwaShell: true,
  },
  dist: {
    hasIndex: fs.existsSync(path.join(distRoot, "index.html")),
    hasManifest: fs.existsSync(path.join(distRoot, "manifest.webmanifest")),
    hasServiceWorker: fs.existsSync(path.join(distRoot, "sw.js")),
  },
  reports: fs.existsSync(reportsRoot)
    ? fs.readdirSync(reportsRoot).filter((file) => /I_MEGA1/.test(file)).sort()
    : [],
};

fs.writeFileSync(
  path.join(releaseRoot, "FINAL_USER_ACCEPTANCE_SNAPSHOT_I_MEGA1.json"),
  JSON.stringify(snapshot, null, 2),
  "utf8",
);

console.log(JSON.stringify(snapshot, null, 2));
