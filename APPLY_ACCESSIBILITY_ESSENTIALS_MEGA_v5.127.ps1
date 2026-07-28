$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "E4 D&D v5.127 Accessibility Essentials Mega starting..."
npm.cmd install --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw "v5.127 dependency install failed." }
npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.127 Chromium install failed." }
npm.cmd run certify:accessibility-essentials
if ($LASTEXITCODE -ne 0) { throw "v5.127 Accessibility Essentials certification failed." }
Write-Host "v5.127 GREEN - Accessibility Essentials closed; next target: Release Hardening Mega v5.128."
