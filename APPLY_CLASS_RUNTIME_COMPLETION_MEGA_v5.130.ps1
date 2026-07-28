$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.130 Class Runtime Completion Mega starting..." -ForegroundColor Cyan

if (-not (Test-Path ".\package.json")) { throw "Run this script from D:\Projects\e4_dnd" }

node .\scripts\install-class-runtime-completion-v5.130.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.130 installer failed." }

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:class-runtime-completion
if ($LASTEXITCODE -ne 0) { throw "v5.130 Class Runtime Completion certification failed." }

Write-Host "v5.130 GREEN - Class Runtime Completion closed; next target: Subclass Runtime Completion Mega v5.131." -ForegroundColor Green
