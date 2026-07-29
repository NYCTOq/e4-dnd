$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D3.4 Play Mode & Rest Character Evidence Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path ".\package.json")) { throw "package.json not found." }
if (-not (Test-Path ".\e2e")) { throw "e2e folder not found." }

node ".\scripts\patch-play-mode-rest-character-evidence-v6.1D3.4.mjs"
if ($LASTEXITCODE -ne 0) { throw "D3.4 patcher failed." }

# Remove duplicate staged tests so Vitest only sees authoritative files.
Get-ChildItem ".\patch_payload", ".\payload" -Recurse -Include "*.test.ts","*.spec.ts" -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

$packagePath = Join-Path $root "package.json"
$packageText = [System.IO.File]::ReadAllText($packagePath).TrimStart([char]0xFEFF)
[System.IO.File]::WriteAllText($packagePath, $packageText, $utf8NoBom)
$null = $packageText | ConvertFrom-Json

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

$results = [ordered]@{
  targetedCharacterJourney = $null
  unitSuite = $null
  productionBuild = $null
  fullE2E = $null
}

npx.cmd playwright test e2e/full-character-creation.spec.ts --workers=4
$results.targetedCharacterJourney = $LASTEXITCODE

npm.cmd run test
$results.unitSuite = $LASTEXITCODE

npm.cmd run build
$results.productionBuild = $LASTEXITCODE

npm.cmd run test:e2e
$results.fullE2E = $LASTEXITCODE

$json = $results | ConvertTo-Json
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\PLAY_MODE_REST_CHARACTER_EVIDENCE_RESULTS_v6.1D3.4.json"),
  $json,
  $utf8NoBom
)

$md = @"
# E4 D&D v6.1D3.4 Play Mode & Rest Character Evidence Closure

- Targeted character journey: $($results.targetedCharacterJourney)
- Unit suite: $($results.unitSuite)
- Production build: $($results.productionBuild)
- Full E2E: $($results.fullE2E)
"@
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\PLAY_MODE_REST_CHARACTER_EVIDENCE_RESULTS_v6.1D3.4.md"),
  $md,
  $utf8NoBom
)

if (($results.Values | Where-Object { $_ -ne 0 }).Count -gt 0) {
  Write-Host "v6.1D3.4 RED - inspect the reports for any remaining isolated failure." -ForegroundColor Red
  exit 1
}

Write-Host "v6.1D3.4 GREEN - Play Mode & Rest Character Evidence Closure passed." -ForegroundColor Green
