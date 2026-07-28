import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";

const steps = [
  ["Unit tests", ["run", "test:release-hardening"]],
  ["Production build", ["run", "build"]],
  ["Artifact audit", ["run", "audit:release-artifacts"]],
  ["Critical E2E", ["run", "test:e2e:release-hardening"]],
];

for (const [label, args] of steps) {
  console.log(`\n[v5.128] ${label}: ${npmCommand} ${args.join(" ")}`);

  const result = spawnSync(npmCommand, args, {
    stdio: "inherit",
    shell: isWindows,
    windowsHide: false,
  });

  if (result.error) {
    console.error(`[v5.128] ${label} could not start.`);
    console.error(result.error);
    process.exit(1);
  }

  if (result.signal) {
    console.error(`[v5.128] ${label} terminated by signal ${result.signal}.`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[v5.128] ${label} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }

  console.log(`[v5.128] ${label} passed.`);
}

console.log("\nv5.128 GREEN - Release Hardening closed; next target: Playable Content Audit v5.129.");
