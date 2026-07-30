$ErrorActionPreference = "Stop"
Write-Host "E4 D&D M-MEGA1b Launch Path Normalization Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

Write-Host ""
Write-Host "[1/3] Repair broken backslash normalization" -ForegroundColor Yellow
node ".\scripts\repair-launch-path-normalization-M-MEGA1B.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Launch path normalization repair failed."
}

Write-Host ""
Write-Host "[2/3] Show current Git state" -ForegroundColor Yellow
git status --short
if ($LASTEXITCODE -ne 0) {
  throw "git status failed."
}

Write-Host ""
Write-Host "[3/3] Re-run final distribution and launch closure" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_FINAL_DISTRIBUTION_LAUNCH_M_MEGA1.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "M-MEGA1b GREEN - Path normalization, launch self-files and final distribution closure passed." -ForegroundColor Green
