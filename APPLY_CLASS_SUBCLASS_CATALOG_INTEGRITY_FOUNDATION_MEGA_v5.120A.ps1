$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.120A Class and Subclass Catalog Integrity Foundation starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:catalog-integrity:foundation
if ($LASTEXITCODE -ne 0) { throw "v5.120A catalog integrity discovery failed." }

Write-Host "v5.120A GREEN - next target: Catalog Differential and Reference Integrity v5.120B." -ForegroundColor Green
