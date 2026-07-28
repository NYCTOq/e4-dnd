$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.121D4 Cross-Domain UI E2E Class Selector Hotfix starting..."

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "Playwright Chromium install failed." }

npm.cmd run certify:cross-domain:final
if ($LASTEXITCODE -ne 0) { throw "v5.121D4 cross-domain UI final closure failed." }

Write-Host "v5.121D4 GREEN - v5.121 series closed; next target: Remaining Player Experience Discovery v5.122A."
