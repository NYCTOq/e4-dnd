$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D1 Global E2E Overlay & Fixture Closure starting..."

node .\scripts\install-global-e2e-overlay-fixture-closure-v6.1D1.mjs
if ($LASTEXITCODE -ne 0) { throw "v6.1D1 installer failed." }

New-Item -ItemType Directory -Force .\reports | Out-Null
$results = [ordered]@{}

& npm.cmd run test:e2e:overlay-closure
$results.targetedE2E = $LASTEXITCODE

& npm.cmd test
$results.fullUnitSuite = $LASTEXITCODE

& npm.cmd run build
$results.productionBuild = $LASTEXITCODE

& npm.cmd run test:e2e
$results.fullE2E = $LASTEXITCODE

$json = $results | ConvertTo-Json
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "reports\E2E_OVERLAY_FIXTURE_CLOSURE_RESULTS_v6.1D1.json"), $json, (New-Object System.Text.UTF8Encoding($false)))

$lines = @(
  "# E4 D&D v6.1D1 E2E Overlay & Fixture Closure",
  "",
  "| Gate | Exit code | Result |",
  "|---|---:|---|",
  "| Targeted E2E | $($results.targetedE2E) | $(if ($results.targetedE2E -eq 0) {'PASS'} else {'FAIL'}) |",
  "| Full unit suite | $($results.fullUnitSuite) | $(if ($results.fullUnitSuite -eq 0) {'PASS'} else {'FAIL'}) |",
  "| Production build | $($results.productionBuild) | $(if ($results.productionBuild -eq 0) {'PASS'} else {'FAIL'}) |",
  "| Full E2E | $($results.fullE2E) | $(if ($results.fullE2E -eq 0) {'PASS'} else {'FAIL'}) |"
)
[System.IO.File]::WriteAllLines((Join-Path (Get-Location) "reports\E2E_OVERLAY_FIXTURE_CLOSURE_RESULTS_v6.1D1.md"), $lines, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Reports:"
Write-Host "  reports\E2E_OVERLAY_FIXTURE_CLOSURE_RESULTS_v6.1D1.md"
Write-Host "  reports\E2E_OVERLAY_FIXTURE_CLOSURE_RESULTS_v6.1D1.json"

if ($results.targetedE2E -ne 0) { throw "Targeted E2E closure still has failures. Send the new terminal output and report." }
if ($results.fullUnitSuite -ne 0) { throw "Unit suite failed after v6.1D1." }
if ($results.productionBuild -ne 0) { throw "Production build failed after v6.1D1." }
if ($results.fullE2E -ne 0) { throw "Full E2E still has residual failures. Send the compact report and output." }
Write-Host "v6.1D1 GREEN - Global E2E Overlay & Fixture Closure passed."
