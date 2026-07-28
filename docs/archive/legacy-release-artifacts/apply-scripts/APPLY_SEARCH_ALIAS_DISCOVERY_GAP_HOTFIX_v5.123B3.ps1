$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.123B3 Search Alias Discovery Gap Hotfix starting..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$root\src\certification\differential\navigationSearchRouteParity.ts" ".\src\certification\differential\navigationSearchRouteParity.ts" -Force
Copy-Item "$root\src\certification\differential\navigationSearchRouteParity.test.ts" ".\src\certification\differential\navigationSearchRouteParity.test.ts" -Force
Copy-Item "$root\scripts\generate-navigation-search-parity-v5-123B.mjs" ".\scripts\generate-navigation-search-parity-v5-123B.mjs" -Force
Copy-Item "$root\certification-reports\navigation-search-route-parity-v5.123B.json" ".\certification-reports\navigation-search-route-parity-v5.123B.json" -Force
Copy-Item "$root\certification-reports\navigation-search-route-parity-v5.123B.md" ".\certification-reports\navigation-search-route-parity-v5.123B.md" -Force
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
npm.cmd run certify:navigation-search:parity
if ($LASTEXITCODE -ne 0) { throw "v5.123B3 navigation/search parity failed." }
Write-Host "v5.123B3 GREEN - v5.123B closed; next target: Golden Search Intent Integration v5.123C."
