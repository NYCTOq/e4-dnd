$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.118C Character Derived Stats Golden Integration starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:derived-stats:character
if ($LASTEXITCODE -ne 0) { throw "v5.118C character integration failed." }

npm.cmd test
if ($LASTEXITCODE -ne 0) { throw "Full regression failed." }

Write-Host "v5.118C GREEN - next target: UI E2E Final Closure v5.118D." -ForegroundColor Green
