$ErrorActionPreference = "Stop"
if (-not (Test-Path ".\package.json")) { throw "Run this script from the D:\Projects\e4_dnd project root." }
Write-Host "E4 D&D v5.121B Cross-Domain Differential and Reference Matrix starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
npm.cmd run certify:cross-domain:differential
if ($LASTEXITCODE -ne 0) { throw "v5.121B cross-domain differential failed." }
Write-Host "v5.121B GREEN - next target: Golden Player Lifecycle Integration v5.121C." -ForegroundColor Green
