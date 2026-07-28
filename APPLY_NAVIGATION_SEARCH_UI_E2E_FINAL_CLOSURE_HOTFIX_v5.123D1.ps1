$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "E4 D&D v5.123D1 Navigation and Search UI E2E Apply Script Hotfix starting..."

$required = @(
  "package.json",
  "src\shared\commands\CommandPalette.tsx",
  "e2e\navigation-search-ui-v5.123D.spec.ts",
  "scripts\audit-navigation-search-ui-v5-123D.mjs"
)

foreach ($path in $required) {
  if (-not (Test-Path (Join-Path $root $path))) {
    throw "Missing v5.123D file: $path"
  }
}

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.123D1 npm install failed." }

npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.123D1 Chromium install failed." }

npm.cmd run certify:navigation-search:final
if ($LASTEXITCODE -ne 0) { throw "v5.123D1 navigation/search final closure failed." }

Write-Host "v5.123D1 GREEN - Navigation and Search closed; next target: Play Feedback and Recovery Discovery v5.124A."
