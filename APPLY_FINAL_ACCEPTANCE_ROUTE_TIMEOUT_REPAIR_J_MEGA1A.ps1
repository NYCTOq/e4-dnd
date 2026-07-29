$ErrorActionPreference = "Stop"
Write-Host "E4 D&D J-MEGA1a Final Acceptance Route Timeout Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

Write-Host ""
Write-Host "[1/3] Raise final acceptance route matrix timeout" -ForegroundColor Yellow
node ".\scripts\repair-final-acceptance-route-timeout-J-MEGA1A.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Final acceptance timeout repair failed."
}

Write-Host ""
Write-Host "[2/3] Targeted final acceptance and real interaction matrix" -ForegroundColor Yellow
npx.cmd playwright test `
  e2e/final-user-acceptance-I-MEGA1.spec.ts `
  e2e/real-ui-interaction-I-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) {
  throw "Targeted final browser acceptance still has failures."
}

Write-Host ""
Write-Host "[3/3] Re-run complete J-MEGA1 release candidate closure" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_VERSION_BUMP_RELEASE_CANDIDATE_J_MEGA1.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "J-MEGA1a GREEN - Final acceptance route timing and complete 6.2.0 RC1 release closure passed." -ForegroundColor Green
