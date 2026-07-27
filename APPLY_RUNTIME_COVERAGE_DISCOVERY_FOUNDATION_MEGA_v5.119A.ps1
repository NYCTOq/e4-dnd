$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.119A Runtime Coverage Discovery Foundation starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:runtime-coverage:foundation
if ($LASTEXITCODE -ne 0) { throw "v5.119A runtime coverage discovery failed." }

Write-Host "v5.119A GREEN - next target: Runtime Differential and Missing Behavior Closure v5.119B." -ForegroundColor Green
