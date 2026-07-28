$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "E4 D&D v5.123C1 Navigation Search Zero-Gap Assertion Hotfix starting..."
$required = @(
  "$root\src\certification\differential\navigationSearchRouteParity.test.ts",
  "$root\scripts\generate-navigation-search-parity-v5-123B.mjs",
  "$root\package.json"
)
foreach ($file in $required) { if (-not (Test-Path $file)) { throw "Missing required file: $file" } }
Push-Location $root
try {
  npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
  npm.cmd run certify:navigation-search:golden
  if ($LASTEXITCODE -ne 0) { throw "v5.123C1 golden search intent integration failed." }
  Write-Host "v5.123C1 GREEN - v5.123C closed; next target: Navigation and Search UI E2E Final Closure v5.123D."
}
finally { Pop-Location }
