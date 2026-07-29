$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D2.3 Builder Option Discovery Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path ".\package.json")) { throw "package.json not found." }
if (-not (Test-Path ".\e2e")) { throw "e2e folder not found." }

Copy-Item ".\payload\builder-ui-mega.spec.ts" ".\e2e\builder-ui-mega.spec.ts" -Force

# Vitest must never discover patch payload Playwright specs.
Get-ChildItem ".\patch_payload" -Recurse -Filter "*.spec.ts" -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem ".\payload" -Recurse -Filter "*.spec.ts" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -ne (Join-Path $root "payload\builder-ui-mega.spec.ts") } |
  Remove-Item -Force -ErrorAction SilentlyContinue

# Keep package.json BOM-free.
$packagePath = Join-Path $root "package.json"
$packageText = [System.IO.File]::ReadAllText($packagePath).TrimStart([char]0xFEFF)
[System.IO.File]::WriteAllText($packagePath, $packageText, $utf8NoBom)
$null = $packageText | ConvertFrom-Json

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

$results = [ordered]@{
  targetedBuilderE2E = $null
  unitSuite = $null
  productionBuild = $null
  fullE2E = $null
}

npx.cmd playwright test e2e/builder-ui-mega.spec.ts --workers=4
$results.targetedBuilderE2E = $LASTEXITCODE

# Remove payload spec before Vitest discovery.
Remove-Item ".\payload\builder-ui-mega.spec.ts" -Force -ErrorAction SilentlyContinue

npm.cmd run test
$results.unitSuite = $LASTEXITCODE

npm.cmd run build
$results.productionBuild = $LASTEXITCODE

npm.cmd run test:e2e
$results.fullE2E = $LASTEXITCODE

$json = $results | ConvertTo-Json
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\BUILDER_OPTION_DISCOVERY_RESULTS_v6.1D2.3.json"),
  $json,
  $utf8NoBom
)

$md = @"
# E4 D&D v6.1D2.3 Builder Option Discovery Closure

- Targeted Builder E2E: $($results.targetedBuilderE2E)
- Unit suite: $($results.unitSuite)
- Production build: $($results.productionBuild)
- Full E2E: $($results.fullE2E)
"@
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\BUILDER_OPTION_DISCOVERY_RESULTS_v6.1D2.3.md"),
  $md,
  $utf8NoBom
)

if (($results.Values | Where-Object { $_ -ne 0 }).Count -gt 0) {
  Write-Host "v6.1D2.3 RED - remaining failures are isolated in the report." -ForegroundColor Red
  exit 1
}

Write-Host "v6.1D2.3 GREEN - Builder Option Discovery Closure passed." -ForegroundColor Green
