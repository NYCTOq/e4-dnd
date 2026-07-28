$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.122B Character Hub Actionability Matrix starting..."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.122B npm install failed." }
npm.cmd run certify:character-hub:matrix
if ($LASTEXITCODE -ne 0) { throw "v5.122B character hub matrix failed." }
Write-Host "v5.122B GREEN - next target: Golden Character Hub Integration v5.122C."
