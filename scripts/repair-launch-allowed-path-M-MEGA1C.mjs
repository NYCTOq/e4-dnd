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
  `$path = ($path.Trim('"') -replace '\\\\', '/')`,
  `$path = ($path.Trim('"') -replace '\\\\', '/')`,
);

source = source.replace(
  `if ($path -eq $allowed.Replace("", "/")) {`,
  `$allowedNormalized = ($allowed -replace '\\\\', '/')
    if ($path -eq $allowedNormalized) {`,
);

source = source.replace(
  `if ($path -eq $allowed.Replace("\\", "/")) {`,
  `$allowedNormalized = ($allowed -replace '\\\\', '/')
    if ($path -eq $allowedNormalized) {`,
);

const marker = `  "scripts/repair-launch-path-normalization-M-MEGA1B.mjs"
)`;

const replacement = `  "scripts/repair-launch-path-normalization-M-MEGA1B.mjs",
  "APPLY_LAUNCH_ALLOWED_PATH_REPAIR_M_MEGA1C.ps1",
  "README_LAUNCH_ALLOWED_PATH_REPAIR_M_MEGA1C.md",
  "scripts/repair-launch-allowed-path-M-MEGA1C.mjs"
)`;

if (source.includes(marker)) {
  source = source.replace(marker, replacement);
}

if (!source.includes("$allowedNormalized")) {
  throw new Error("Allowed-path normalization repair was not applied.");
}

fs.writeFileSync(targetPath, source, "utf8");

console.log(JSON.stringify({
  target: path.relative(process.cwd(), targetPath),
  pathNormalized: source.includes(`$path = ($path.Trim('"') -replace '\\\\', '/')`),
  allowedPathNormalized: source.includes("$allowedNormalized"),
  hotfixFilesAllowed: source.includes("M_MEGA1C"),
}, null, 2));
