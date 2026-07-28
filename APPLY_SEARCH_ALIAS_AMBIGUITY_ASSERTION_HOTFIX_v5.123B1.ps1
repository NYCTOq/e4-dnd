$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.123B1 Search Alias Ambiguity Assertion Hotfix starting..."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
npm.cmd run certify:navigation-search:parity
if ($LASTEXITCODE -ne 0) { throw "v5.123B1 navigation/search parity failed." }
Write-Host "v5.123B1 GREEN - v5.123B repaired; next target: Golden Search Intent Integration v5.123C."
