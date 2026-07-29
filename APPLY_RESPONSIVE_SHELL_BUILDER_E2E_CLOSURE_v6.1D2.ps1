$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D2 Responsive Shell & Builder E2E Closure starting..." -ForegroundColor Cyan
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
if (-not (Test-Path ".\package.json")) { throw "package.json not found. Extract patch contents into project root." }
Copy-Item ".\patch_payload\e2e\app-shell.spec.ts" ".\e2e\app-shell.spec.ts" -Force
Copy-Item ".\patch_payload\e2e\builder-ui-mega.spec.ts" ".\e2e\builder-ui-mega.spec.ts" -Force
$pkg = Get-Content ".\package.json" -Raw | ConvertFrom-Json
$pkg.scripts | Add-Member -NotePropertyName "test:e2e:responsive-closure" -NotePropertyValue "playwright test e2e/app-shell.spec.ts e2e/builder-ui-mega.spec.ts --workers=4" -Force
$pkg.scripts | Add-Member -NotePropertyName "certify:e2e:responsive-closure" -NotePropertyValue "npm run test:e2e:responsive-closure && npm run test && npm run build && npm run test:e2e" -Force
$packageJson = $pkg | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText((Join-Path $root "package.json"), $packageJson, (New-Object System.Text.UTF8Encoding($false)))
New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
$results = [ordered]@{ targetedE2E=$null; unitSuite=$null; productionBuild=$null; fullE2E=$null }
npm.cmd run test:e2e:responsive-closure; $results.targetedE2E=$LASTEXITCODE
npm.cmd run test; $results.unitSuite=$LASTEXITCODE
npm.cmd run build; $results.productionBuild=$LASTEXITCODE
npm.cmd run test:e2e; $results.fullE2E=$LASTEXITCODE
$json=$results|ConvertTo-Json
[System.IO.File]::WriteAllText((Join-Path $root "reports\E2E_RESPONSIVE_SHELL_BUILDER_RESULTS_v6.1D2.json"),$json,(New-Object System.Text.UTF8Encoding($false)))
$md="# E4 D&D v6.1D2 Responsive Shell & Builder E2E Closure`r`n`r`n- Targeted E2E: $($results.targetedE2E)`r`n- Unit suite: $($results.unitSuite)`r`n- Production build: $($results.productionBuild)`r`n- Full E2E: $($results.fullE2E)`r`n"
[System.IO.File]::WriteAllText((Join-Path $root "reports\E2E_RESPONSIVE_SHELL_BUILDER_RESULTS_v6.1D2.md"),$md,(New-Object System.Text.UTF8Encoding($false)))
if (($results.Values | Where-Object { $_ -ne 0 }).Count -gt 0) { Write-Host "v6.1D2 RED - inspect reports and terminal output." -ForegroundColor Red; exit 1 }
Write-Host "v6.1D2 GREEN - Responsive Shell & Builder E2E Closure passed." -ForegroundColor Green
