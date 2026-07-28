$ErrorActionPreference = "Stop"
Write-Host "v5.110B Equipment & Combat Differential Matrix uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-equipment-combat-v5-110B.mjs
npm.cmd run certify:equipment-combat:full
