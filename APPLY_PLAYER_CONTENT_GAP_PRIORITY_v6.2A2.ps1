$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2A2 Player Content Gap Priority starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\reports\PLAYER_CONTENT_INVENTORY_v6.2A1.json")) {
  throw "v6.2A1 inventory report not found."
}

node ".\scripts\generate-player-content-gap-priority-v6.2A2.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "v6.2A2 gap priority generation failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\PLAYER_CONTENT_GAP_PRIORITY_v6.2A2.json"
Write-Host "  reports\PLAYER_CONTENT_GAP_PRIORITY_v6.2A2.md"
Write-Host ""
Write-Host "v6.2A2 GREEN - Player Content Gap Priority generated." -ForegroundColor Green
