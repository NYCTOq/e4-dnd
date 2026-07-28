$ErrorActionPreference = "Stop"

Write-Host "E4 D&D v5.104 Builder syntax repair uygulanıyor..." -ForegroundColor Cyan
node .\scripts\repair-v5-104-builder-syntax.mjs
npm.cmd run verify:ancestry-mega
