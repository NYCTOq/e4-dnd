import fs from "node:fs";
import path from "node:path";

const targetPath = path.join(
  process.cwd(),
  "APPLY_FINAL_DISTRIBUTION_LAUNCH_M_MEGA1.ps1",
);

if (!fs.existsSync(targetPath)) {
  throw new Error(`Target script not found: ${targetPath}`);
}

let source = fs.readFileSync(targetPath, "utf8");

source = source.replace(
  `$path = $path.Trim('"').Replace("", "/")`,
  `$path = ($path.Trim('"') -replace '\\\\', '/')`,
);

source = source.replace(
  `$path = $path.Trim('"').Replace("\\", "/")`,
  `$path = ($path.Trim('"') -replace '\\\\', '/')`,
);

const marker = `  "release/STAGING_ROLLBACK_REHEARSAL_M_MEGA1.md"
)`;

const replacement = `  "release/STAGING_ROLLBACK_REHEARSAL_M_MEGA1.md",
  "APPLY_LAUNCH_SELF_DIRTY_GIT_CHECK_REPAIR_M_MEGA1A.ps1",
  "README_LAUNCH_SELF_DIRTY_GIT_CHECK_REPAIR_M_MEGA1A.md",
  "scripts/repair-launch-self-dirty-git-check-M-MEGA1A.mjs",
  "APPLY_LAUNCH_PATH_NORMALIZATION_REPAIR_M_MEGA1B.ps1",
  "README_LAUNCH_PATH_NORMALIZATION_REPAIR_M_MEGA1B.md",
  "scripts/repair-launch-path-normalization-M-MEGA1B.mjs"
)`;

if (source.includes(marker)) {
  source = source.replace(marker, replacement);
}

if (!source.includes(`-replace '\\\\', '/'`)) {
  throw new Error("Path normalization repair was not applied.");
}

fs.writeFileSync(targetPath, source, "utf8");

console.log(JSON.stringify({
  target: path.relative(process.cwd(), targetPath),
  regexPathNormalization: source.includes(`-replace '\\\\', '/'`),
  hotfixFilesAllowed: source.includes("M_MEGA1B"),
}, null, 2));
