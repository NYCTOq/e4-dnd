$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.120B Catalog Differential and Reference Integrity starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:catalog-integrity:differential
if ($LASTEXITCODE -ne 0) { throw "v5.120B catalog differential failed." }

Write-Host "v5.120B GREEN - next target: Golden Class and Subclass Integration v5.120C." -ForegroundColor Green
