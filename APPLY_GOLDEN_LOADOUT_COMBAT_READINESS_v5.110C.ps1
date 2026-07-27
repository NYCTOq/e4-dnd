$ErrorActionPreference = "Stop"

Write-Host "v5.110C Golden Loadout & Combat Readiness uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-golden-loadout-v5-110C.mjs
npm.cmd run certify:equipment-combat:complete
