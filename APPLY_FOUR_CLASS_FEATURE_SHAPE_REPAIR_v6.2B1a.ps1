$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2B1a Feature Shape Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

node ".\scripts\repair-four-class-feature-shape-v6.2B1a.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Feature shape repair failed."
}

Write-Host ""
Write-Host "Re-running the full v6.2B1 package..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_FOUR_CLASS_PLAYER_READINESS_v6.2B1.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "v6.2B1a GREEN - Feature shape repair and four-class readiness passed." -ForegroundColor Green
