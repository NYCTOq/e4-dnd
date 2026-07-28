$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.122C Golden Character Hub Integration starting..."
if (-not (Test-Path ".\package.json")) { throw "Run this script from the e4_dnd project root." }
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.122C npm install failed." }
npm.cmd run certify:character-hub:golden
if ($LASTEXITCODE -ne 0) { throw "v5.122C golden character hub certification failed." }
Write-Host "v5.122C GREEN - next target: Character Hub UI E2E Final Closure v5.122D."
