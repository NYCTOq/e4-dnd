$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Invoke-CmdChecked {
  param(
    [Parameter(Mandatory=$true)][string]$Command,
    [Parameter(Mandatory=$true)][string]$Stage
  )

  $stageKey = $Stage.ToLowerInvariant()
  $stdoutLog = Join-Path $PSScriptRoot ('.nmega10_' + $stageKey + '_stdout.log')
  $stderrLog = Join-Path $PSScriptRoot ('.nmega10_' + $stageKey + '_stderr.log')

  Remove-Item $stdoutLog, $stderrLog -Force -ErrorAction SilentlyContinue

  $process = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList @('/d', '/s', '/c', $Command) `
    -WorkingDirectory $PSScriptRoot `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -Wait `
    -PassThru `
    -NoNewWindow

  if ($process.ExitCode -ne 0) {
    Write-Host ('N-MEGA10 RED - ' + $Stage) -ForegroundColor Red
    if (Test-Path $stdoutLog) {
      Write-Host ('=== ' + $Stage + ' STDOUT ===')
      Get-Content $stdoutLog -Tail 50
    }
    if (Test-Path $stderrLog) {
      Write-Host ('=== ' + $Stage + ' STDERR ===')
      Get-Content $stderrLog -Tail 50
    }
    exit $process.ExitCode
  }

  Remove-Item $stdoutLog, $stderrLog -Force -ErrorAction SilentlyContinue
}

Invoke-CmdChecked -Stage 'TEST' -Command 'npm.cmd exec vitest run -- src/core/rulesets/playStatusRuntime-N-MEGA10.test.ts'
Invoke-CmdChecked -Stage 'BUILD' -Command 'npm.cmd run build'

Write-Host 'N-MEGA10 HOTFIX3 GREEN' -ForegroundColor Green
