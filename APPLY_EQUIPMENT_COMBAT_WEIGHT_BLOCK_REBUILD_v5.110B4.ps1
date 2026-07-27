$ErrorActionPreference = "Stop"

Write-Host "v5.110B4 Equipment & Combat Weight Block Rebuild uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-weight-block-rebuild-v5-110B4.mjs
npm.cmd run certify:equipment-combat:full
