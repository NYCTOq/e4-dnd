import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const releaseRoot = path.join(projectRoot, "release");
const reportsRoot = path.join(projectRoot, "reports");
const distRoot = path.join(projectRoot, "dist");

fs.mkdirSync(releaseRoot, { recursive: true });

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

const releaseFiles = listFiles(releaseRoot);
const reportFiles = listFiles(reportsRoot);
const distFiles = [];

if (fs.existsSync(distRoot)) {
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        distFiles.push(
          path.relative(distRoot, fullPath).replace(/\\/g, "/"),
        );
      }
    }
  };

  walk(distRoot);
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  schemaVersion: "H-MEGA2",
  releaseArtifacts: releaseFiles,
  reportArtifacts: reportFiles.filter((file) =>
    /H_MEGA1|H_MEGA2|G_MEGA2/.test(file),
  ),
  dist: {
    fileCount: distFiles.length,
    hasIndex: distFiles.includes("index.html"),
    hasManifest: distFiles.includes("manifest.webmanifest"),
    hasServiceWorker: distFiles.includes("sw.js"),
  },
  recoveryReadiness: {
    hasRollbackPlan: releaseFiles.includes("ROLLBACK_PLAN_G_MEGA1.md"),
    hasOperationsSnapshot: releaseFiles.includes(
      "PRODUCTION_HEALTH_SNAPSHOT_H_MEGA1.json",
    ),
    hasRecoveryChecklist: releaseFiles.includes(
      "USER_RECOVERY_CHECKLIST_H_MEGA2.md",
    ),
    hasMaintenanceRunbook: releaseFiles.includes(
      "MAINTENANCE_RUNBOOK_H_MEGA2.md",
    ),
  },
};

fs.writeFileSync(
  path.join(releaseRoot, "MAINTENANCE_SNAPSHOT_H_MEGA2.json"),
  JSON.stringify(snapshot, null, 2),
  "utf8",
);

console.log(JSON.stringify(snapshot, null, 2));
