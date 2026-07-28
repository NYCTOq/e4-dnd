$ErrorActionPreference = "Stop"
Write-Host "v5.106 Mega Certification Expansion kuruluyor..." -ForegroundColor Cyan
node .\scripts\apply-mega-certification-v5-106.mjs
npm.cmd run certify:mega:quick
