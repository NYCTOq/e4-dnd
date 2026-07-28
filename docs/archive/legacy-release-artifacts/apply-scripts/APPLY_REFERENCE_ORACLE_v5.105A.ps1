$ErrorActionPreference = "Stop"
Write-Host "v5.105A Official Reference Oracle kuruluyor..." -ForegroundColor Cyan
node .\scripts\apply-reference-oracle-v5-105a.mjs
npm.cmd run verify:oracle
