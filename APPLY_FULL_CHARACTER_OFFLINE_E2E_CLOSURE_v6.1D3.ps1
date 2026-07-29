$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D3 Full Character Journey & Offline E2E Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path ".\package.json")) { throw "package.json not found." }
if (-not (Test-Path ".\e2e")) { throw "e2e folder not found." }

node ".\scripts\patch-full-character-offline-e2e-v6.1D3.mjs"
if ($LASTEXITCODE -ne 0) { throw "D3 patcher failed." }

# Clean all accidental Playwright specs outside the real e2e folder.
Get-ChildItem ".\patch_payload", ".\payload" -Recurse -Filter "*.spec.ts" -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

# Keep package.json BOM-free.
$packagePath = Join-Path $root "package.json"
$packageText = [System.IO.File]::ReadAllText($packagePath).TrimStart([char]0xFEFF)
[System.IO.File]::WriteAllText($packagePath, $packageText, $utf8NoBom)
$null = $packageText | ConvertFrom-Json

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
$results = [ordered]@{
  targetedLegacyE2E = $null
  unitSuite = $null
  productionBuild = $null
  fullE2E = $null
}

$targets = Get-ChildItem ".\e2e" -Filter "*.spec.ts" |
  Where-Object {
    $_.Name -match "full-character|offline|initiative|character.*list|app-shell"
  } |
  ForEach-Object { "e2e/$($_.Name)" }

if ($targets.Count -gt 0) {
  npx.cmd playwright test $targets --workers=4
  $results.targetedLegacyE2E = $LASTEXITCODE
} else {
  $results.targetedLegacyE2E = 0
}

npm.cmd run test
$results.unitSuite = $LASTEXITCODE

npm.cmd run build
$results.productionBuild = $LASTEXITCODE

npm.cmd run test:e2e
$results.fullE2E = $LASTEXITCODE

$json = $results | ConvertTo-Json
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\FULL_CHARACTER_OFFLINE_E2E_RESULTS_v6.1D3.json"),
  $json,
  $utf8NoBom
)

$md = @"
# E4 D&D v6.1D3 Full Character Journey & Offline E2E Closure

- Targeted legacy E2E: $($results.targetedLegacyE2E)
- Unit suite: $($results.unitSuite)
- Production build: $($results.productionBuild)
- Full E2E: $($results.fullE2E)
"@
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\FULL_CHARACTER_OFFLINE_E2E_RESULTS_v6.1D3.md"),
  $md,
  $utf8NoBom
)

if (($results.Values | Where-Object { $_ -ne 0 }).Count -gt 0) {
  Write-Host "v6.1D3 RED - remaining failures are isolated in the reports." -ForegroundColor Red
  exit 1
}

Write-Host "v6.1D3 GREEN - Full Character Journey & Offline E2E Closure passed." -ForegroundColor Green
