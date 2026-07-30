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

const oldBlock = `$dirty = git status --porcelain
if ($LASTEXITCODE -ne 0) { throw "git status failed." }
if ($dirty) { throw "Working tree clean degil. Once degisiklikleri commit et." }`;

const newBlock = `$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0) { throw "git status failed." }

$allowedLaunchFiles = @(
  "APPLY_FINAL_DISTRIBUTION_LAUNCH_M_MEGA1.ps1",
  "PUBLISH_GITHUB_RELEASE_M_MEGA1.ps1",
  "PREPARE_HOSTING_PACKAGES_M_MEGA1.ps1",
  "RUN_LIVE_SMOKE_M_MEGA1.ps1",
  "RECORD_DEVICE_ACCEPTANCE_M_MEGA1.ps1",
  "README_FINAL_DISTRIBUTION_LAUNCH_M_MEGA1.md",
  "release/STAGING_ROLLBACK_REHEARSAL_M_MEGA1.md"
)

$unexpectedDirty = @()

foreach ($line in $dirty) {
  if (-not $line) { continue }

  $path = $line.Substring(3).Trim()
  $path = $path.Trim('"').Replace("\", "/")

  $isAllowed = $false

  foreach ($allowed in $allowedLaunchFiles) {
    if ($path -eq $allowed.Replace("\", "/")) {
      $isAllowed = $true
      break
    }
  }

  if (-not $isAllowed) {
    $unexpectedDirty += $line
  }
}

if ($unexpectedDirty.Count -gt 0) {
  Write-Host "Beklenmeyen Git degisiklikleri:" -ForegroundColor Red
  $unexpectedDirty | ForEach-Object { Write-Host "  $_" }
  throw "Working tree icinde launch paketi disinda commit edilmemis degisiklik var."
}

if ($dirty.Count -gt 0) {
  Write-Host "Yalnizca M-MEGA1 launch dosyalari untracked/modified; devam ediliyor." -ForegroundColor DarkYellow
}`;

if (!source.includes(oldBlock) && !source.includes(newBlock)) {
  throw new Error("Git cleanliness block not found.");
}

source = source.replace(oldBlock, newBlock);
fs.writeFileSync(targetPath, source, "utf8");

console.log(JSON.stringify({
  target: path.relative(process.cwd(), targetPath),
  launchFilesIgnored: source.includes("$allowedLaunchFiles"),
  unexpectedChangesStillBlocked: source.includes("$unexpectedDirty"),
}, null, 2));
