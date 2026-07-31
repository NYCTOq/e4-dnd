$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Invoke-CmdChecked {
  param(
    [Parameter(Mandatory=$true)][string]$Command,
    [Parameter(Mandatory=$true)][string]$Stage
  )

  $log = Join-Path $PSScriptRoot (".nmega10_" + $Stage.ToLowerInvariant() + ".log")
  if (Test-Path $log) { Remove-Item $log -Force }

  $process = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList @('/d','/s','/c', $Command) `
    -WorkingDirectory $PSScriptRoot `
    -RedirectStandardOutput $log `
    -RedirectStandardError $log `
    -Wait `
    -PassThru `
    -NoNewWindow

  if ($process.ExitCode -ne 0) {
    Write-Host ("N-MEGA10 RED - " + $Stage) -ForegroundColor Red
    if (Test-Path $log) { Get-Content $log -Tail 60 }
    exit $process.ExitCode
  }
}

Invoke-CmdChecked -Stage 'TEST' -Command 'npm.cmd exec vitest run -- src/core/rulesets/playStatusRuntime-N-MEGA10.test.ts'
Invoke-CmdChecked -Stage 'BUILD' -Command 'npm.cmd run build'

Remove-Item (Join-Path $PSScriptRoot '.nmega10_test.log') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $PSScriptRoot '.nmega10_build.log') -Force -ErrorAction SilentlyContinue
Write-Host 'N-MEGA10 HOTFIX2 GREEN' -ForegroundColor Green
