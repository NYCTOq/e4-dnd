import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const steps = [
  ["Full Vitest regression", ["test"]],
  ["Production build", ["run", "build"]],
  ["Release artifact audit", ["run", "audit:release-artifacts"]],
  ["Critical desktop/mobile E2E", ["run", "test:e2e:rc-v5.136"]],
];

const startedAt = new Date();
const results = [];
for (const [label, args] of steps) {
  console.log(`\n=== ${label} ===`);
  const started = Date.now();
  const result = spawnSync(npm, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  const status = result.status ?? 1;
  results.push({ label, status, durationMs: Date.now() - started });
  if (status !== 0) {
    writeReport(false, results, startedAt);
    process.exit(status);
  }
}
writeReport(true, results, startedAt);
console.log("\nv5.136 GREEN - Full Regression & Release Candidate closed.");

function writeReport(green, rows, started) {
  const reportDir = path.resolve("reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const finished = new Date();
  const lines = [
    "# E4 D&D v5.136 Release Candidate Report",
    "",
    `- Status: **${green ? "GREEN" : "FAILED"}**`,
    `- Started: ${started.toISOString()}`,
    `- Finished: ${finished.toISOString()}`,
    "",
    "| Gate | Result | Duration |",
    "|---|---:|---:|",
    ...rows.map((row) => `| ${row.label} | ${row.status === 0 ? "PASS" : "FAIL"} | ${(row.durationMs / 1000).toFixed(1)}s |`),
    "",
    green
      ? "The v5.136 release-candidate gate completed successfully."
      : "The release candidate was not approved. Fix the first failed gate and rerun the same command.",
    "",
  ];
  fs.writeFileSync(path.join(reportDir, "FULL_REGRESSION_RELEASE_CANDIDATE_v5.136.md"), lines.join("\n"), "utf8");
}
