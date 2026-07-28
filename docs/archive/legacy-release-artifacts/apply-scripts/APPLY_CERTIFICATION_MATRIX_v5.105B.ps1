$ErrorActionPreference = "Stop"
Write-Host "v5.105B Automated Certification Matrix kuruluyor..." -ForegroundColor Cyan
node .\scripts\apply-certification-matrix-v5-105b.mjs
npm.cmd run certify:quick
