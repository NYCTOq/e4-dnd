$ErrorActionPreference = "Stop"

Write-Host "v5.110B2 Equipment & Combat Dynamic Import Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-dynamic-import-hotfix-v5-110B2.mjs
npm.cmd run certify:equipment-combat:full
