$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.123A Navigation and Search Discovery Foundation starting..."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
npm.cmd run certify:navigation-search:foundation
if ($LASTEXITCODE -ne 0) { throw "v5.123A navigation and search discovery failed." }
Write-Host "v5.123A GREEN - next target: Search Alias Differential and Route Parity Matrix v5.123B."
