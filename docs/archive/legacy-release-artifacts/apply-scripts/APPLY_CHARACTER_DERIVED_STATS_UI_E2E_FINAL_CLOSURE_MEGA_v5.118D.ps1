$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.118D Character Derived Stats UI E2E Final Closure starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:derived-stats:final
if ($LASTEXITCODE -ne 0) { throw "v5.118D final closure failed." }

npm.cmd test
if ($LASTEXITCODE -ne 0) { throw "Full regression failed." }

Write-Host "v5.118D GREEN - Character Derived Stats series closed." -ForegroundColor Green
