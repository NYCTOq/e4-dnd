$ErrorActionPreference = "Stop"

Write-Host "v5.110D1 Equipment & Combat E2E Selector Matrix Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-e2e-selector-matrix-hotfix-v5-110D1.mjs
npm.cmd run certify:equipment-combat:e2e
