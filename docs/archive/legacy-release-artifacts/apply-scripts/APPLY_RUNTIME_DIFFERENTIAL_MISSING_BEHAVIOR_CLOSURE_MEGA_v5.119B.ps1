$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.119B Runtime Differential and Missing Behavior Closure starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:runtime-coverage:runtime
if ($LASTEXITCODE -ne 0) { throw "v5.119B runtime coverage closure failed." }

npm.cmd test
if ($LASTEXITCODE -ne 0) { throw "Full regression failed." }

Write-Host "v5.119B GREEN - next target: Golden Runtime Entity Integration v5.119C." -ForegroundColor Green
