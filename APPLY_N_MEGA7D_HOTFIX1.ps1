$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Log = Join-Path $Root "N_MEGA7D_LAST_RUN.log"
if (Test-Path $Log) { Remove-Item $Log -Force }

function Run-NativeStep {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $false)][string[]]$Arguments = @()
  )

  Add-Content -Path $Log -Value "`n=== $Name ==="
  $stdout = Join-Path $env:TEMP ("e4_nmega7d_" + [guid]::NewGuid().ToString("N") + ".out.log")
  $stderr = Join-Path $env:TEMP ("e4_nmega7d_" + [guid]::NewGuid().ToString("N") + ".err.log")

  try {
    $process = Start-Process -FilePath $FilePath `
      -ArgumentList $Arguments `
      -WorkingDirectory $Root `
      -NoNewWindow `
      -Wait `
      -PassThru `
      -RedirectStandardOutput $stdout `
      -RedirectStandardError $stderr

    if (Test-Path $stdout) { Get-Content $stdout | Add-Content $Log }
    if (Test-Path $stderr) { Get-Content $stderr | Add-Content $Log }

    if ($process.ExitCode -ne 0) {
      Write-Host "N-MEGA7D RED - $Name" -ForegroundColor Red
      Get-Content $Log -Tail 45
      exit $process.ExitCode
    }
  }
  finally {
    Remove-Item $stdout, $stderr -Force -ErrorAction SilentlyContinue
  }
}

Run-NativeStep -Name "PATCH" -FilePath "node.exe" -Arguments @((Join-Path $Root "APPLY_N_MEGA7D.mjs"))
Run-NativeStep -Name "TEST" -FilePath "npm.cmd" -Arguments @(
  "exec", "--", "vitest", "run",
  "src/core/rulesets/spellOngoingEffectRuntime-N-MEGA7D.test.ts",
  "src/core/rulesets/spellMultiTargetResolution-N-MEGA7C.test.ts",
  "src/core/rulesets/spellOutcomeResolution-N-MEGA7B.test.ts",
  "src/core/rulesets/spellCastTransaction-N-MEGA7A.test.ts"
)
Run-NativeStep -Name "BUILD" -FilePath "npm.cmd" -Arguments @("run", "build")

Write-Host "N-MEGA7D HOTFIX1 GREEN" -ForegroundColor Green
