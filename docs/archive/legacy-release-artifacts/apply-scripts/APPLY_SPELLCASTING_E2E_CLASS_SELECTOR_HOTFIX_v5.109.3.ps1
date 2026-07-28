$ErrorActionPreference = "Stop"
Write-Host "v5.109.3 Spellcasting E2E Class Selector Hotfix uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-spellcasting-class-selector-v5-109-3.mjs
npm.cmd run certify:spellcasting:e2e
