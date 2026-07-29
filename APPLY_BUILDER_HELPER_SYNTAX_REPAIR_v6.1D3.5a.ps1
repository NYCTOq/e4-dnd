$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D3.5a Builder Helper Syntax Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path ".\package.json")) { throw "package.json not found." }
if (-not (Test-Path ".\e2e\full-character-creation.spec.ts")) {
  throw "e2e/full-character-creation.spec.ts not found."
}

node ".\scripts\repair-builder-helper-syntax-v6.1D3.5a.mjs"
if ($LASTEXITCODE -ne 0) { throw "D3.5a repair patcher failed." }

Get-ChildItem ".\patch_payload", ".\payload" -Recurse -Include "*.test.ts","*.spec.ts" -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

$packagePath = Join-Path $root "package.json"
$packageText = [System.IO.File]::ReadAllText($packagePath).TrimStart([char]0xFEFF)
[System.IO.File]::WriteAllText($packagePath, $packageText, $utf8NoBom)
$null = $packageText | ConvertFrom-Json

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

$results = [ordered]@{
  playwrightList = $null
  repeatedCharacterJourney = $null
  unitSuite = $null
  productionBuild = $null
  fullE2E = $null
}

# Parse/collection gate. Stops immediately if the TypeScript file is malformed.
npx.cmd playwright test e2e/full-character-creation.spec.ts --list
$results.playwrightList = $LASTEXITCODE
if ($results.playwrightList -ne 0) {
  throw "Playwright collection failed after syntax repair."
}

npx.cmd playwright test e2e/full-character-creation.spec.ts --workers=4 --repeat-each=3
$results.repeatedCharacterJourney = $LASTEXITCODE

npm.cmd run test
$results.unitSuite = $LASTEXITCODE

npm.cmd run build
$results.productionBuild = $LASTEXITCODE

npm.cmd run test:e2e
$results.fullE2E = $LASTEXITCODE

$json = $results | ConvertTo-Json
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\BUILDER_HELPER_SYNTAX_REPAIR_RESULTS_v6.1D3.5a.json"),
  $json,
  $utf8NoBom
)

$md = @"
# E4 D&D v6.1D3.5a Builder Helper Syntax Repair

- Playwright collection: $($results.playwrightList)
- Repeated character journey: $($results.repeatedCharacterJourney)
- Unit suite: $($results.unitSuite)
- Production build: $($results.productionBuild)
- Full E2E: $($results.fullE2E)
"@
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\BUILDER_HELPER_SYNTAX_REPAIR_RESULTS_v6.1D3.5a.md"),
  $md,
  $utf8NoBom
)

if (($results.Values | Where-Object { $_ -ne 0 }).Count -gt 0) {
  Write-Host "v6.1D3.5a RED - syntax is repaired; inspect remaining isolated test failures." -ForegroundColor Red
  exit 1
}

Write-Host "v6.1D3.5a GREEN - Builder Helper Syntax Repair passed." -ForegroundColor Green
