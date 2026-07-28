$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.120D Class and Subclass UI E2E Final Closure starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "Playwright Chromium install failed." }

npm.cmd run certify:catalog-integrity:final
if ($LASTEXITCODE -ne 0) { throw "v5.120D class/subclass UI final closure failed." }

Write-Host "v5.120D GREEN - next target: Cross-Domain Integrity Discovery Foundation v5.121A." -ForegroundColor Green
