$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.121C2 Golden Optional Field Type Hotfix starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:cross-domain:golden
if ($LASTEXITCODE -ne 0) { throw "v5.121C2 golden lifecycle certification failed." }

Write-Host "v5.121C2 GREEN - v5.121C closed; next target: Cross-Domain UI E2E Final Closure v5.121D." -ForegroundColor Green
