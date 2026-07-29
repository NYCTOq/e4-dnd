$ErrorActionPreference = "Stop"
Write-Host "E4 D&D I-MEGA2a Visible Control Interaction Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

Write-Host ""
Write-Host "[1/3] Repair hidden responsive-control locators" -ForegroundColor Yellow
node ".\scripts\repair-real-ui-visible-controls-I-MEGA2A.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Visible control locator repair failed."
}

Write-Host ""
Write-Host "[2/3] Targeted desktop, tablet and mobile browser interaction" -ForegroundColor Yellow
npx.cmd playwright test e2e/real-ui-interaction-I-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) {
  throw "Targeted real UI browser interaction still has failures."
}

Write-Host ""
Write-Host "[3/3] Re-run complete I-MEGA2 closure" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_REAL_UI_INTERACTION_I_MEGA2.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "I-MEGA2a GREEN - Visible input, select and physical button interaction repair passed." -ForegroundColor Green
