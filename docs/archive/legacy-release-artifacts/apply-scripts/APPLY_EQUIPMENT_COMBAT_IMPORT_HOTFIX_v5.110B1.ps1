$ErrorActionPreference = "Stop"

Write-Host "v5.110B1 Equipment & Combat Import Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-import-hotfix-v5-110B1.mjs
npm.cmd run certify:equipment-combat:full
