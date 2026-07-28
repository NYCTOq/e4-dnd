$ErrorActionPreference = "Stop"
Write-Host "v5.107 Class & Background Certification Mega kuruluyor..." -ForegroundColor Cyan
node .\scripts\apply-class-background-certification-v5-107.mjs
npm.cmd run certify:class-background:quick
