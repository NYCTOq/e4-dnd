$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$Log = Join-Path $Root "N_MEGA7D_LAST_RUN.log"
if (Test-Path $Log) { Remove-Item $Log -Force }

function Run-Step([string]$Name, [scriptblock]$Command) {
  Add-Content $Log "`n=== $Name ==="
  & $Command *>> $Log
  if ($LASTEXITCODE -ne 0) {
    Write-Host "N-MEGA7D RED - $Name" -ForegroundColor Red
    Get-Content $Log -Tail 35
    exit 1
  }
}

Run-Step "PATCH" { node (Join-Path $Root "APPLY_N_MEGA7D.mjs") }
Run-Step "TEST" { npm.cmd exec vitest run -- src/core/rulesets/spellOngoingEffectRuntime-N-MEGA7D.test.ts src/core/rulesets/spellMultiTargetResolution-N-MEGA7C.test.ts src/core/rulesets/spellOutcomeResolution-N-MEGA7B.test.ts src/core/rulesets/spellCastTransaction-N-MEGA7A.test.ts }
Run-Step "BUILD" { npm.cmd run build }

Write-Host "N-MEGA7D GREEN" -ForegroundColor Green
