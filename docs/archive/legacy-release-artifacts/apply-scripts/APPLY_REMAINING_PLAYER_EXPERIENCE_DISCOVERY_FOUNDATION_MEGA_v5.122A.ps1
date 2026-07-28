$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.122A Remaining Player Experience Discovery starting..."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.122A npm install failed." }
npm.cmd run certify:player-experience:foundation
if ($LASTEXITCODE -ne 0) { throw "v5.122A player experience foundation failed." }
Write-Host "v5.122A GREEN - next target: Character Hub Actionability Differential and Navigation Matrix v5.122B."
