$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Run-Step([string]$Name, [string]$File, [string[]]$Args) {
  $out = Join-Path $env:TEMP ("e4_nmega7d_" + $Name + "_out.log")
  $err = Join-Path $env:TEMP ("e4_nmega7d_" + $Name + "_err.log")
  Remove-Item $out,$err -Force -ErrorAction SilentlyContinue
  $p = Start-Process -FilePath $File -ArgumentList $Args -WorkingDirectory $Root -Wait -PassThru -NoNewWindow -RedirectStandardOutput $out -RedirectStandardError $err
  if ($p.ExitCode -ne 0) {
    Write-Host ("N-MEGA7D RED - " + $Name) -ForegroundColor Red
    Get-Content $out,$err -ErrorAction SilentlyContinue | Select-Object -Last 55
    exit $p.ExitCode
  }
}

Run-Step 'PATCH' 'node.exe' @('.\APPLY_N_MEGA7D_HOTFIX2.mjs')
Run-Step 'TEST' 'npm.cmd' @('exec','vitest','run','--','src/core/rulesets/spellOngoingEffectRuntime-N-MEGA7D.test.ts','src/core/rulesets/spellMultiTargetResolution-N-MEGA7C.test.ts','src/core/rulesets/spellOutcomeResolution-N-MEGA7B.test.ts','src/core/rulesets/spellCastTransaction-N-MEGA7A.test.ts')
Run-Step 'BUILD' 'npm.cmd' @('run','build')
Write-Host 'N-MEGA7D HOTFIX2 GREEN' -ForegroundColor Green
