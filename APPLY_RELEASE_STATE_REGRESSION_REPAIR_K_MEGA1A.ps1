$ErrorActionPreference = "Stop"
Write-Host "E4 D&D K-MEGA1a Release State Regression Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

Write-Host ""
Write-Host "[1/3] Repair RC tests for public-release compatibility" -ForegroundColor Yellow
node ".\scripts\repair-release-state-regression-K-MEGA1A.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Release state regression repair failed."
}

Write-Host ""
Write-Host "[2/3] Targeted release-state regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/versionBumpReleaseCandidate-J-MEGA1.test.ts `
  src/certification/player-readiness/deploymentPackageRollback-J-MEGA2.test.ts `
  src/certification/player-readiness/finalPublicRelease-K-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Targeted release-state regression still has failures."
}

Write-Host ""
Write-Host "[3/3] Re-run complete K-MEGA1 public release closure" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_FINAL_PUBLIC_RELEASE_K_MEGA1.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "K-MEGA1a GREEN - RC compatibility, public-release state and full 6.2.0 final certification passed." -ForegroundColor Green
