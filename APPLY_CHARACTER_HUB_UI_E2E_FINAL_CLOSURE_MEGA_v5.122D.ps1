$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.122D Character Hub UI E2E Final Closure starting..."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "Chromium installation failed." }
npm.cmd run certify:character-hub:final
if ($LASTEXITCODE -ne 0) { throw "v5.122D character hub UI final closure failed." }
Write-Host "v5.122D GREEN - Character Hub Actionability closed; next target: Remaining Player Experience Navigation and Search Discovery v5.123A."
