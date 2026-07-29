$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D2a Persistence Key Collision Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

node ".\scripts\repair-guided-feature-persistence-key-v6.2D2a.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Persistence key collision repair failed."
}

Write-Host ""
Write-Host "Re-running the complete v6.2D2 package..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_GUIDED_FEATURE_AUTOMATION_WAVE1_v6.2D2.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "v6.2D2a GREEN - Persistence key collision repair and automation wave passed." -ForegroundColor Green
