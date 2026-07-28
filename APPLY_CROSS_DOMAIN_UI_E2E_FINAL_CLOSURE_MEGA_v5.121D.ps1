$ErrorActionPreference = "Stop"
if (-not (Test-Path ".\package.json")) { throw "Run this script from the D:\Projects\e4_dnd project root." }
Write-Host "E4 D&D v5.121D Cross-Domain UI E2E Final Closure starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "Playwright Chromium install failed." }
npm.cmd run certify:cross-domain:final
if ($LASTEXITCODE -ne 0) { throw "v5.121D cross-domain UI final closure failed." }
Write-Host "v5.121D GREEN - Cross-Domain Integrity series closed; next target: Remaining Player Experience Discovery v5.122A." -ForegroundColor Green
