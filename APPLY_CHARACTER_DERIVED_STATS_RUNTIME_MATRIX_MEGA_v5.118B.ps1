$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.118B Character Derived Stats Runtime Matrix starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:derived-stats:runtime
if ($LASTEXITCODE -ne 0) { throw "v5.118B runtime certification failed." }

npm.cmd test
if ($LASTEXITCODE -ne 0) { throw "Full regression failed." }

Write-Host "v5.118B GREEN - next target: Golden Character Integration v5.118C." -ForegroundColor Green
