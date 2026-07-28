$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.119D Runtime Coverage UI E2E Final Closure starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:runtime-coverage:final
if ($LASTEXITCODE -ne 0) { throw "v5.119D final closure failed." }

npm.cmd test
if ($LASTEXITCODE -ne 0) { throw "Full regression failed." }

Write-Host "v5.119D GREEN - Runtime Coverage series closed; next target: Class and Subclass Catalog Integrity v5.120A." -ForegroundColor Green
