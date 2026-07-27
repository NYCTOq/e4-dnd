$ErrorActionPreference = "Stop"

Write-Host "v5.110B3 Equipment & Combat Weight Matrix Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-weight-matrix-hotfix-v5-110B3.mjs
npm.cmd run certify:equipment-combat:full
