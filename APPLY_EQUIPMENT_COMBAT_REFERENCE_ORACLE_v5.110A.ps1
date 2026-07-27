$ErrorActionPreference = "Stop"
Write-Host "v5.110A Equipment & Combat Reference Oracle uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-equipment-combat-v5-110A.mjs
npm.cmd run certify:equipment-combat:quick
