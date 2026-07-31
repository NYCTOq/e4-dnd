Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$LogRoot = Join-Path $Root 'certification-reports\n-mega12\logs'
$ReportRoot = Split-Path -Parent $LogRoot
New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null

$startedAt = Get-Date
$results = New-Object System.Collections.Generic.List[object]

function Write-FailureSummary {
  param(
    [string]$Name,
    [string]$StdOut,
    [string]$StdErr,
    [int]$ExitCode
  )

  Write-Host "N-MEGA12 RED - $Name (exit=$ExitCode)" -ForegroundColor Red
  if (Test-Path $StdErr) {
    $errorLines = Get-Content $StdErr -ErrorAction SilentlyContinue
    if ($errorLines.Count -gt 0) {
      Write-Host "`n=== ERROR ==="
      $errorLines | Select-Object -Last 80 | ForEach-Object { Write-Host $_ }
    }
  }
  if (Test-Path $StdOut) {
    $outputLines = Get-Content $StdOut -ErrorAction SilentlyContinue
    if ($outputLines.Count -gt 0) {
      Write-Host "`n=== OUTPUT ==="
      $outputLines | Select-Object -Last 80 | ForEach-Object { Write-Host $_ }
    }
  }
}

function Invoke-Gate {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$CommandLine
  )

  $safe = ($Name -replace '[^A-Za-z0-9._-]', '_')
  $stdout = Join-Path $LogRoot "$safe.stdout.log"
  $stderr = Join-Path $LogRoot "$safe.stderr.log"
  Remove-Item $stdout, $stderr -Force -ErrorAction SilentlyContinue

  $gateStart = Get-Date
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & cmd.exe /d /s /c $CommandLine 1> $stdout 2> $stderr
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousPreference
  $gateEnd = Get-Date

  $results.Add([pscustomobject]@{
    name = $Name
    command = $CommandLine
    exitCode = $exitCode
    startedAt = $gateStart.ToString('o')
    finishedAt = $gateEnd.ToString('o')
    durationSeconds = [math]::Round(($gateEnd - $gateStart).TotalSeconds, 2)
    stdout = (Resolve-Path $stdout -ErrorAction SilentlyContinue).Path
    stderr = (Resolve-Path $stderr -ErrorAction SilentlyContinue).Path
  })

  if ($exitCode -ne 0) {
    Write-FailureSummary -Name $Name -StdOut $stdout -StdErr $stderr -ExitCode $exitCode
    Save-FinalReport -Status 'RED' -FailedGate $Name
    exit $exitCode
  }
}

function Save-FinalReport {
  param(
    [Parameter(Mandatory = $true)][string]$Status,
    [string]$FailedGate = ''
  )

  $finishedAt = Get-Date
  $report = [ordered]@{
    schemaVersion = 1
    certification = 'N-MEGA12 FINAL PLAYER SYSTEM CERTIFICATION'
    status = $Status
    failedGate = $FailedGate
    startedAt = $startedAt.ToString('o')
    finishedAt = $finishedAt.ToString('o')
    durationSeconds = [math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)
    nodeVersion = (& node --version 2>$null)
    npmVersion = (& npm.cmd --version 2>$null)
    packageVersion = if (Test-Path (Join-Path $Root 'package.json')) { (Get-Content (Join-Path $Root 'package.json') -Raw | ConvertFrom-Json).version } else { $null }
    gates = @($results)
  }

  $jsonPath = Join-Path $ReportRoot 'N_MEGA12_FINAL_CERTIFICATION.json'
  $mdPath = Join-Path $ReportRoot 'N_MEGA12_FINAL_CERTIFICATION.md'
  $report | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add('# N-MEGA12 Final Player System Certification')
  $lines.Add('')
  $lines.Add("- Status: **$Status**")
  $lines.Add("- Started: $($startedAt.ToString('o'))")
  $lines.Add("- Finished: $($finishedAt.ToString('o'))")
  $lines.Add("- Duration: $([math]::Round(($finishedAt - $startedAt).TotalMinutes, 2)) minutes")
  if ($FailedGate) { $lines.Add("- Failed gate: **$FailedGate**") }
  $lines.Add('')
  $lines.Add('| Gate | Exit | Seconds |')
  $lines.Add('|---|---:|---:|')
  foreach ($gate in $results) {
    $lines.Add("| $($gate.name) | $($gate.exitCode) | $($gate.durationSeconds) |")
  }
  $lines | Set-Content -Path $mdPath -Encoding UTF8
}

# Preflight. Fail early with a useful message instead of letting Node recite ancient riddles.
$required = @(
  'package.json',
  'src',
  'e2e',
  'playwright.config.ts',
  'node_modules',
  'src/core/rulesets/spellCharacterCombatAdapter.ts',
  'src/core/rulesets/spellCastTransaction-N-MEGA7A.test.ts',
  'src/core/rulesets/spellOutcomeResolution.ts',
  'src/core/rulesets/spellOutcomeResolution-N-MEGA7B.test.ts',
  'src/core/rulesets/spellMultiTargetResolution-N-MEGA7C.test.ts',
  'src/core/rulesets/spellOngoingEffectRuntime.ts',
  'src/core/rulesets/spellOngoingEffectRuntime-N-MEGA7D.test.ts',
  'src/core/rulesets/inventoryActionRuntime-N-MEGA8.ts',
  'src/core/rulesets/inventoryActionRuntime-N-MEGA8.test.ts',
  'src/core/rulesets/multiclassAdvancementRuntime-N-MEGA9.ts',
  'src/core/rulesets/multiclassAdvancementRuntime-N-MEGA9.test.ts',
  'src/core/rulesets/playStatusRuntime.ts',
  'src/core/rulesets/playStatusRuntime-N-MEGA10.test.ts',
  'src/core/runtime/guidedFeatureRuntime.ts',
  'src/core/runtime/guidedFeatureRuntime-N-MEGA11.test.ts'
)

$missing = @($required | Where-Object { -not (Test-Path (Join-Path $Root $_)) })
if ($missing.Count -gt 0) {
  Write-Host 'N-MEGA12 RED - PREFLIGHT' -ForegroundColor Red
  Write-Host 'Eksik dosya/klasorler:'
  $missing | ForEach-Object { Write-Host " - $_" }
  exit 2
}

Invoke-Gate -Name '01_GIT_DIFF_CHECK' -CommandLine 'git diff --check'
Invoke-Gate -Name '02_LINT' -CommandLine 'npm.cmd run lint'
Invoke-Gate -Name '03_FULL_UNIT_INTEGRATION' -CommandLine 'npm.cmd test'
Invoke-Gate -Name '04_PRODUCTION_BUILD' -CommandLine 'npm.cmd run build'
Invoke-Gate -Name '05_SECURITY_CONTEXT' -CommandLine 'npm.cmd run audit:security:context'
Invoke-Gate -Name '06_BUNDLE_PERFORMANCE' -CommandLine 'npm.cmd run audit:bundle-performance'
Invoke-Gate -Name '07_FULL_DESKTOP_MOBILE_E2E' -CommandLine 'npm.cmd run test:e2e'

Save-FinalReport -Status 'GREEN'
Write-Host 'N-MEGA12 FINAL GREEN' -ForegroundColor Green
