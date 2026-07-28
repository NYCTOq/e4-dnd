$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "E4 D&D v5.123C Golden Search Intent Integration starting..."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.123C npm install failed." }
npm.cmd run certify:navigation-search:golden
if ($LASTEXITCODE -ne 0) { throw "v5.123C golden search intent integration failed." }
Write-Host "v5.123C GREEN - next target: Navigation and Search UI E2E Final Closure v5.123D."
