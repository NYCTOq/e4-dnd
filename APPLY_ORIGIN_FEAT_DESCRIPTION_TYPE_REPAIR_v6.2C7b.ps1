$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C7b Feat Text Type Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

node ".\scripts\repair-origin-feat-description-type-v6.2C7b.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Feat text type repair failed."
}

Write-Host ""
Write-Host "Re-running the complete v6.2C7 package..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_ORIGIN_FEAT_RUNTIME_MATRIX_v6.2C7.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "v6.2C7b GREEN - Feat text type repair and origin/feat runtime passed." -ForegroundColor Green
