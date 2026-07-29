$ErrorActionPreference = "Stop"
Write-Host "E4 D&D E-MEGA1a Duplicate Manifest Locator Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

node ".\scripts\repair-e-mega1-manifest-locator.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Manifest locator repair failed."
}

Write-Host ""
Write-Host "Re-running the complete E-MEGA1 package..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_FULL_INTERACTIVE_PLAYER_JOURNEY_E_MEGA1.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "E-MEGA1a GREEN - Duplicate manifest locator repair and full interactive journey passed." -ForegroundColor Green
