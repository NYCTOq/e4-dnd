$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "E4 D&D v5.127D1 Accessibility Mobile Help Trigger Hotfix starting..." -ForegroundColor Cyan

$required = Join-Path $root "e2e\accessibility-essentials-v5.127.spec.ts"
if (-not (Test-Path $required)) { throw "v5.127D1 test file missing." }

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.127D1 npm install failed." }

npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.127D1 Chromium install failed." }

npm.cmd run certify:accessibility-essentials
if ($LASTEXITCODE -ne 0) { throw "v5.127D1 Accessibility Essentials certification failed." }

Write-Host "v5.127D1 GREEN - Accessibility Essentials closed; next target: Release Hardening Mega v5.128." -ForegroundColor Green
