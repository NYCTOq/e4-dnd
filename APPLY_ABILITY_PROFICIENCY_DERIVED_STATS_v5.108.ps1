$ErrorActionPreference = "Stop"
Write-Host "v5.108 Ability, Proficiency & Derived Stats Mega kuruluyor..." -ForegroundColor Cyan
node .\scripts\apply-ability-proficiency-v5-108.mjs
npm.cmd run certify:ability:quick
