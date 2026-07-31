$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Source = Join-Path $Root 'N_MEGA14_FILES'
$AncestryTarget = Join-Path $Root 'src\core\rulesets\ancestryRuntimeRules.ts'
$CalculatorTarget = Join-Path $Root 'src\core\character\characterCalculator.ts'

foreach ($target in @($AncestryTarget, $CalculatorTarget)) {
  if (-not (Test-Path $target)) { throw "Target not found: $target" }
  Copy-Item $target "$target.nmega14.bak" -Force
}

Copy-Item (Join-Path $Source 'ancestryRuntimeRules.ts') $AncestryTarget -Force
Copy-Item (Join-Path $Source 'characterCalculator.ts') $CalculatorTarget -Force
Copy-Item (Join-Path $Source 'ancestryRuntimeRules.N-MEGA14.test.ts') (Join-Path $Root 'src\core\rulesets\ancestryRuntimeRules.N-MEGA14.test.ts') -Force
Copy-Item (Join-Path $Source 'characterCalculatorMulticlass.N-MEGA14.test.ts') (Join-Path $Root 'src\core\character\characterCalculatorMulticlass.N-MEGA14.test.ts') -Force
Copy-Item (Join-Path $Source 'n-mega14-report.mjs') (Join-Path $Root 'scripts\n-mega14-report.mjs') -Force

Write-Host 'N-MEGA14 files installed.'
Write-Host 'FOCUSED UNIT TESTS START'

& npm.cmd exec vitest run -- src/core/rulesets/ancestryRuntimeRules.N-MEGA14.test.ts src/core/character/characterCalculatorMulticlass.N-MEGA14.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA14 RED - UNIT exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host 'REPORT START'
& node .\scripts\n-mega14-report.mjs
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA14 RED - REPORT exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host 'BUILD START'
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA14 RED - BUILD exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host 'N-MEGA14 ANCESTRY AND SPELLCASTING CLOSURE GREEN'
