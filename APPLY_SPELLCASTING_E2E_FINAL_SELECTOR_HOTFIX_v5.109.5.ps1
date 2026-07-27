$ErrorActionPreference = "Stop"

Write-Host "v5.109.5 Spellcasting E2E Final Selector Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spellcasting-final-selector-v5-109-5.mjs
npm.cmd run certify:spellcasting:e2e
