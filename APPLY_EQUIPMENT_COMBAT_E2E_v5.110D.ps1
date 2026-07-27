$ErrorActionPreference = "Stop"

Write-Host "v5.110D Equipment & Combat E2E Certification uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-e2e-v5-110D.mjs
npm.cmd run certify:equipment-combat:release
