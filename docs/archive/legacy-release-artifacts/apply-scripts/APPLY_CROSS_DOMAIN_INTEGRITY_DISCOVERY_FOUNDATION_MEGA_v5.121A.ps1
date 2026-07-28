$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Run this script from the D:\Projects\e4_dnd project root."
}

Write-Host "E4 D&D v5.121A Cross-Domain Integrity Discovery Foundation starting..." -ForegroundColor Cyan
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:cross-domain:foundation
if ($LASTEXITCODE -ne 0) { throw "v5.121A cross-domain foundation failed." }

Write-Host "v5.121A GREEN - next target: Cross-Domain Differential and Reference Matrix v5.121B." -ForegroundColor Green
