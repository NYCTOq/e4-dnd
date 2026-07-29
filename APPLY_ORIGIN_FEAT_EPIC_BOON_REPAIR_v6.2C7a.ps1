$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C7a Epic Boon Ruleset Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

node ".\scripts\repair-origin-feat-epic-boon-v6.2C7a.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Epic Boon ruleset repair failed."
}

Write-Host ""
Write-Host "Re-running the complete v6.2C7 package..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\APPLY_ORIGIN_FEAT_RUNTIME_MATRIX_v6.2C7.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "v6.2C7a GREEN - Epic Boon ruleset repair and origin/feat runtime passed." -ForegroundColor Green
