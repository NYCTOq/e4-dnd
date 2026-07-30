$ErrorActionPreference = "Stop"
Write-Host "E4 D&D M-MEGA1a Launch Self-Dirty Git Check Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

Write-Host ""
Write-Host "[1/3] Repair launch package Git cleanliness check" -ForegroundColor Yellow
node ".\scripts\repair-launch-self-dirty-git-check-M-MEGA1A.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Launch Git check repair failed."
}

Write-Host ""
Write-Host "[2/3] Show remaining Git state" -ForegroundColor Yellow
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
Write-Host "M-MEGA1a GREEN - Launch package self-files accepted and final distribution closure passed." -ForegroundColor Green
