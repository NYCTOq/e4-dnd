$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.119C Golden Runtime Entity Integration starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:runtime-coverage:entities
if ($LASTEXITCODE -ne 0) { throw "v5.119C golden runtime integration failed." }

npm.cmd test
if ($LASTEXITCODE -ne 0) { throw "Full regression failed." }

Write-Host "v5.119C GREEN - next target: Runtime Coverage UI E2E Final Closure v5.119D." -ForegroundColor Green
