$ErrorActionPreference = "Stop"

Write-Host "v5.109.4 Spellcasting E2E DOM Integrity Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spellcasting-dom-integrity-v5-109-4.mjs
npm.cmd run certify:spellcasting:e2e
