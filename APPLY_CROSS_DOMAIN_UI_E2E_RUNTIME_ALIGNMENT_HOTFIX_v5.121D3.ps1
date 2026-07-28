$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.121D3 Cross-Domain UI E2E Runtime Alignment Hotfix starting..."

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.121D3 npm install failed." }

npm.cmd exec playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.121D3 Chromium install failed." }

npm.cmd run certify:cross-domain:final
if ($LASTEXITCODE -ne 0) { throw "v5.121D3 cross-domain UI final closure failed." }

Write-Host "v5.121D3 GREEN - v5.121 series closed; next target: Remaining Player Experience Discovery v5.122A."
