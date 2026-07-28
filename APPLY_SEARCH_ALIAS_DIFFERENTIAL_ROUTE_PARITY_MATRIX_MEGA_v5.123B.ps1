$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.123B Search Alias Differential and Route Parity Matrix starting..."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
npm.cmd run certify:navigation-search:parity
if ($LASTEXITCODE -ne 0) { throw "v5.123B navigation/search parity failed." }
Write-Host "v5.123B GREEN - next target: Golden Search Intent Integration v5.123C."
