$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.128 Release Hardening Mega starting..." -ForegroundColor Cyan

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "Chromium installation failed." }

npm.cmd run certify:release-hardening
if ($LASTEXITCODE -ne 0) { throw "v5.128 Release Hardening certification failed." }

Write-Host "v5.128 GREEN - Release Hardening closed; next target: Playable Content Audit v5.129." -ForegroundColor Green
