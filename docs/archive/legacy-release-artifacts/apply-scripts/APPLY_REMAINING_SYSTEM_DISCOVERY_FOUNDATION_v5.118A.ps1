$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.118A Remaining System Discovery/Foundation starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:remaining-system:foundation
if ($LASTEXITCODE -ne 0) { throw "v5.118A foundation certification failed." }

Write-Host "v5.118A GREEN - next target: Full Character Sheet Derived Stats v5.118B." -ForegroundColor Green
