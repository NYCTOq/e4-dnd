$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$SourceDir = Join-Path $Root 'N_MEGA13_FILES'
$CalculatorTarget = Join-Path $Root 'src\core\character\characterCalculator.ts'
$TestTarget = Join-Path $Root 'src\core\character\characterCalculatorSpellcastingAbility.test.ts'
$AuditTarget = Join-Path $Root 'scripts\n-mega13-ancestry-runtime-audit.mjs'

if (-not (Test-Path $CalculatorTarget)) { throw "Target not found: $CalculatorTarget" }

Copy-Item $CalculatorTarget "$CalculatorTarget.nmega13.bak" -Force
Copy-Item (Join-Path $SourceDir 'characterCalculator.ts') $CalculatorTarget -Force
Copy-Item (Join-Path $SourceDir 'characterCalculatorSpellcastingAbility.test.ts') $TestTarget -Force
Copy-Item (Join-Path $SourceDir 'n-mega13-ancestry-runtime-audit.mjs') $AuditTarget -Force

Write-Host 'N-MEGA13 files installed.'
Write-Host 'UNIT TEST START'
& npm.cmd exec vitest run -- src/core/character/characterCalculatorSpellcastingAbility.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'ANCESTRY AUDIT START'
& node $AuditTarget
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'BUILD START'
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'N-MEGA13 SPELL ABILITY AND ANCESTRY AUDIT GREEN'
