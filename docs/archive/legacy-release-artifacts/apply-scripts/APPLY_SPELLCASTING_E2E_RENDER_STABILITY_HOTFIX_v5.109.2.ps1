$ErrorActionPreference = "Stop"
Write-Host "v5.109.2 Spellcasting E2E Render Stability Hotfix uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-spellcasting-render-stability-v5-109-2.mjs
npm.cmd run certify:spellcasting:e2e
