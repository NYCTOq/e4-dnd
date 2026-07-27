$ErrorActionPreference = "Stop"
Write-Host "v5.109 Spellcasting & Spell Progression Mega kuruluyor..." -ForegroundColor Cyan
node .\scripts\apply-spellcasting-v5-109.mjs
npm.cmd run certify:spellcasting:quick
