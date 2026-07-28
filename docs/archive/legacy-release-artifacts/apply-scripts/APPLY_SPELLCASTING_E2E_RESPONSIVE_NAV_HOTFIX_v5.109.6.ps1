$ErrorActionPreference = "Stop"

Write-Host "v5.109.6 Spellcasting E2E Responsive Navigation Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spellcasting-responsive-nav-v5-109-6.mjs
npm.cmd run certify:spellcasting:e2e
