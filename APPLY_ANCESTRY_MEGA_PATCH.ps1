$ErrorActionPreference = "Stop"

Write-Host "E4 D&D ancestry/species mega patch uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-ancestry-builder-mega-patch.mjs
npm.cmd run verify:ancestry-mega
