$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "E4 D&D v5.123D2 Navigation and Search UI Result Label Hotfix starting..."
if (-not (Test-Path ".\e2e\navigation-search-ui-v5.123D.spec.ts")) { throw "v5.123D2 E2E spec missing." }
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.123D2 npm install failed." }
npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.123D2 Chromium install failed." }
npm.cmd run certify:navigation-search:final
if ($LASTEXITCODE -ne 0) { throw "v5.123D2 navigation/search final closure failed." }
Write-Host "v5.123D2 GREEN - Navigation and Search closed; next target: Play Feedback and Recovery Discovery v5.124A."
