$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Fail-Step([string]$Name, [string]$LogPath, [int]$Code) {
  Write-Host ("N-MEGA7D RED - " + $Name) -ForegroundColor Red
  if (Test-Path $LogPath) { Get-Content $LogPath | Select-Object -Last 55 }
  exit $Code
}

$patchLog = Join-Path $env:TEMP 'e4_nmega7d_hotfix3_patch.log'
$testLog  = Join-Path $env:TEMP 'e4_nmega7d_hotfix3_test.log'
$buildLog = Join-Path $env:TEMP 'e4_nmega7d_hotfix3_build.log'
Remove-Item $patchLog,$testLog,$buildLog -Force -ErrorAction SilentlyContinue

& node.exe '.\APPLY_N_MEGA7D_HOTFIX3.mjs' *> $patchLog
if ($LASTEXITCODE -ne 0) { Fail-Step 'PATCH' $patchLog $LASTEXITCODE }

& npm.cmd exec vitest run -- `
  'src/core/rulesets/spellOngoingEffectRuntime-N-MEGA7D.test.ts' `
  'src/core/rulesets/spellMultiTargetResolution-N-MEGA7C.test.ts' `
  'src/core/rulesets/spellOutcomeResolution-N-MEGA7B.test.ts' `
  'src/core/rulesets/spellCastTransaction-N-MEGA7A.test.ts' *> $testLog
if ($LASTEXITCODE -ne 0) { Fail-Step 'TEST' $testLog $LASTEXITCODE }

& npm.cmd run build *> $buildLog
if ($LASTEXITCODE -ne 0) { Fail-Step 'BUILD' $buildLog $LASTEXITCODE }

Write-Host 'N-MEGA7D HOTFIX3 GREEN' -ForegroundColor Green
