$ErrorActionPreference = "Stop"
if (-not (Test-Path ".\package.json")) { throw "Run this script from the D:\Projects\e4_dnd project root." }
Write-Host "E4 D&D v5.121C Golden Player Lifecycle Integration starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
npm.cmd run certify:cross-domain:golden
if ($LASTEXITCODE -ne 0) { throw "v5.121C golden player lifecycle failed." }
Write-Host "v5.121C GREEN - next target: Cross-Domain UI E2E Final Closure v5.121D." -ForegroundColor Green
