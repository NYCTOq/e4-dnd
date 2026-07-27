$ErrorActionPreference = "Stop"
Write-Host "v5.109.1 Spellcasting E2E Heading Hotfix uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-spellcasting-heading-hotfix-v5-109-1.mjs
npm.cmd run certify:spellcasting:e2e
