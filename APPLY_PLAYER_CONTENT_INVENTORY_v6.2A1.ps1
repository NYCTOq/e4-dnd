$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2A1 Player Content Inventory starting..." -ForegroundColor Cyan
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
if (-not (Test-Path ".\package.json")) { throw "package.json not found." }
if (-not (Test-Path ".\public\data\dnd_2014\classes.json")) { throw "2014 catalogs not found." }
if (-not (Test-Path ".\public\data\dnd_2024\classes.json")) { throw "2024 catalogs not found." }
New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
npx.cmd vitest run src/certification/inventory/playerContentInventory-v6.2A1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2A1 RED - structural blockers were found." -ForegroundColor Red
  Write-Host "Open reports\PLAYER_CONTENT_INVENTORY_v6.2A1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}
Write-Host "Reports generated:" -ForegroundColor Green
Write-Host "  reports\PLAYER_CONTENT_INVENTORY_v6.2A1.json"
Write-Host "  reports\PLAYER_CONTENT_INVENTORY_v6.2A1.md"
Write-Host "v6.2A1 GREEN - Player Content Inventory generated." -ForegroundColor Green
