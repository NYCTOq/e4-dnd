$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.120C Golden Class and Subclass Integration starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:catalog-integrity:golden
if ($LASTEXITCODE -ne 0) { throw "v5.120C golden class/subclass integration failed." }

Write-Host "v5.120C GREEN - next target: Class and Subclass UI E2E Final Closure v5.120D." -ForegroundColor Green
