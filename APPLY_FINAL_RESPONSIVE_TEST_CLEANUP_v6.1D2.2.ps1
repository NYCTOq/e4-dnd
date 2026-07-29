$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D2.2 Final Responsive Test Cleanup starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path ".\package.json")) { throw "package.json not found." }
if (-not (Test-Path ".\e2e")) { throw "e2e folder not found." }

Copy-Item ".\patch_payload\app-shell.spec.ts" ".\e2e\app-shell.spec.ts" -Force
Copy-Item ".\patch_payload\builder-ui-mega.spec.ts" ".\e2e\builder-ui-mega.spec.ts" -Force

# Remove accidental Playwright copies from Vitest discovery paths.
$accidental = @(
  ".\patch_payload\e2e\app-shell.spec.ts",
  ".\patch_payload\e2e\builder-ui-mega.spec.ts"
)
foreach ($path in $accidental) {
  if (Test-Path $path) { Remove-Item $path -Force }
}
if (Test-Path ".\patch_payload\e2e") {
  $remaining = Get-ChildItem ".\patch_payload\e2e" -Force
  if ($remaining.Count -eq 0) { Remove-Item ".\patch_payload\e2e" -Force }
}

# Ensure package.json remains BOM-free.
$packagePath = Join-Path $root "package.json"
$packageText = [System.IO.File]::ReadAllText($packagePath).TrimStart([char]0xFEFF)
[System.IO.File]::WriteAllText($packagePath, $packageText, $utf8NoBom)
$null = $packageText | ConvertFrom-Json

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

$results = [ordered]@{
  targetedE2E = $null
  unitSuite = $null
  productionBuild = $null
  fullE2E = $null
}

npm.cmd run test:e2e:responsive-closure
$results.targetedE2E = $LASTEXITCODE

npm.cmd run test
$results.unitSuite = $LASTEXITCODE

npm.cmd run build
$results.productionBuild = $LASTEXITCODE

npm.cmd run test:e2e
$results.fullE2E = $LASTEXITCODE

$json = $results | ConvertTo-Json
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\FINAL_RESPONSIVE_TEST_CLEANUP_RESULTS_v6.1D2.2.json"),
  $json,
  $utf8NoBom
)

$md = @"
# E4 D&D v6.1D2.2 Final Responsive Test Cleanup

- Targeted E2E: $($results.targetedE2E)
- Unit suite: $($results.unitSuite)
- Production build: $($results.productionBuild)
- Full E2E: $($results.fullE2E)
"@
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\FINAL_RESPONSIVE_TEST_CLEANUP_RESULTS_v6.1D2.2.md"),
  $md,
  $utf8NoBom
)

if (($results.Values | Where-Object { $_ -ne 0 }).Count -gt 0) {
  Write-Host "v6.1D2.2 RED - remaining failures are now isolated." -ForegroundColor Red
  exit 1
}

Write-Host "v6.1D2.2 GREEN - Final Responsive Test Cleanup passed." -ForegroundColor Green
