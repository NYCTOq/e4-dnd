$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.123B3a Search Alias Discovery Gap Apply Script Hotfix starting..."

$projectRoot = (Get-Location).Path
$requiredFiles = @(
  "src\certification\differential\navigationSearchRouteParity.ts",
  "src\certification\differential\navigationSearchRouteParity.test.ts",
  "scripts\generate-navigation-search-parity-v5-123B.mjs",
  "certification-reports\navigation-search-route-parity-v5.123B.json",
  "certification-reports\navigation-search-route-parity-v5.123B.md"
)

foreach ($relativePath in $requiredFiles) {
  $fullPath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path $fullPath)) {
    throw "Required v5.123B3 file is missing: $relativePath. Extract the original v5.123B3 ZIP over the project first."
  }
}

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:navigation-search:parity
if ($LASTEXITCODE -ne 0) { throw "v5.123B3a navigation/search parity failed." }

Write-Host "v5.123B3a GREEN - v5.123B closed; next target: Golden Search Intent Integration v5.123C."
