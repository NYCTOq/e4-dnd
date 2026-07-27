$ErrorActionPreference = "Stop"

Write-Host "v5.110B5 Equipment & Combat Build Type Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-build-type-hotfix-v5-110B5.mjs
npm.cmd run certify:equipment-combat:full
