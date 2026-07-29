$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D3.3 Final E2E & Contract Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path ".\package.json")) { throw "package.json not found." }
if (-not (Test-Path ".\e2e")) { throw "e2e folder not found." }

node ".\scripts\patch-final-e2e-contract-v6.1D3.3.mjs"
if ($LASTEXITCODE -ne 0) { throw "D3.3 patcher failed." }

Get-ChildItem ".\patch_payload", ".\payload" -Recurse -Include "*.test.ts","*.spec.ts" -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

$packagePath = Join-Path $root "package.json"
$packageText = [System.IO.File]::ReadAllText($packagePath).TrimStart([char]0xFEFF)
[System.IO.File]::WriteAllText($packagePath, $packageText, $utf8NoBom)
$null = $packageText | ConvertFrom-Json

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
$results = [ordered]@{
  targetedCharacterJourney = $null
  targetedContract = $null
  unitSuite = $null
  productionBuild = $null
  fullE2E = $null
}

npx.cmd playwright test e2e/full-character-creation.spec.ts --workers=4
$results.targetedCharacterJourney = $LASTEXITCODE

npx.cmd vitest run src/certification/integration/characterDerivedStatsUiE2eContract.test.ts
$results.targetedContract = $LASTEXITCODE

npm.cmd run test
$results.unitSuite = $LASTEXITCODE

npm.cmd run build
$results.productionBuild = $LASTEXITCODE

npm.cmd run test:e2e
$results.fullE2E = $LASTEXITCODE

$json = $results | ConvertTo-Json
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\FINAL_E2E_CONTRACT_CLOSURE_RESULTS_v6.1D3.3.json"),
  $json,
  $utf8NoBom
)

$md = @"
# E4 D&D v6.1D3.3 Final E2E & Contract Closure

- Targeted character journey: $($results.targetedCharacterJourney)
- Targeted UI contract: $($results.targetedContract)
- Unit suite: $($results.unitSuite)
- Production build: $($results.productionBuild)
- Full E2E: $($results.fullE2E)
"@
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\FINAL_E2E_CONTRACT_CLOSURE_RESULTS_v6.1D3.3.md"),
  $md,
  $utf8NoBom
)

if (($results.Values | Where-Object { $_ -ne 0 }).Count -gt 0) {
  Write-Host "v6.1D3.3 RED - remaining failures are isolated." -ForegroundColor Red
  exit 1
}

Write-Host "v6.1D3.3 GREEN - Final E2E & Contract Closure passed." -ForegroundColor Green
