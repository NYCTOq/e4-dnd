$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.134 Session Play Loop Mega starting..."
if (-not (Test-Path ".\package.json")) { throw "Run this script from D:\Projects\e4_dnd" }
python ".\scripts\apply-v5.134.py"
if ($LASTEXITCODE -ne 0) { throw "v5.134 source application failed." }
Write-Host "v5.134 files applied."
npm.cmd run certify:session-play-loop
if ($LASTEXITCODE -ne 0) { throw "v5.134 Session Play Loop certification failed." }
Write-Host "v5.134 GREEN - Session Play Loop closed; next target: Playable Gap Closure v5.135."
