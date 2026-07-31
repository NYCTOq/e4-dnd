$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$ReportDir = Join-Path $Root 'certification-reports\n-mega12'
$LogDir = Join-Path $ReportDir 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Invoke-Gate {
  param(
    [Parameter(Mandatory=$true)][string]$Name,
    [Parameter(Mandatory=$true)][string]$CommandLine
  )

  $stdout = Join-Path $LogDir ($Name + '.stdout.log')
  $stderr = Join-Path $LogDir ($Name + '.stderr.log')
  Remove-Item $stdout,$stderr -Force -ErrorAction SilentlyContinue

  $proc = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList @('/d','/s','/c', $CommandLine) `
    -WorkingDirectory $Root `
    -NoNewWindow `
    -Wait `
    -PassThru `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr

  $outLines = @()
  $errLines = @()
  if (Test-Path $stdout) { $outLines = @(Get-Content $stdout -ErrorAction SilentlyContinue) }
  if (Test-Path $stderr) { $errLines = @(Get-Content $stderr -ErrorAction SilentlyContinue) }

  if ($proc.ExitCode -ne 0) {
    Write-Host "N-MEGA12 RED - $Name (exit=$($proc.ExitCode))"
    if ($errLines.Count -gt 0) {
      Write-Host "`n=== ERROR ==="
      $errLines | Select-Object -Last 60 | ForEach-Object { Write-Host $_ }
    }
    if ($outLines.Count -gt 0) {
      Write-Host "`n=== OUTPUT ==="
      $outLines | Select-Object -Last 60 | ForEach-Object { Write-Host $_ }
    }
    exit $proc.ExitCode
  }

  # git and npm can emit harmless warnings to stderr even on success.
  # Preserve logs, but judge the gate strictly by the real process exit code.
  Write-Host "$Name GREEN"
}

# Preflight: required N-series source files must exist.
$required = @(
  'src\core\rulesets\spellCastTransaction-N-MEGA7A.test.ts',
  'src\core\rulesets\spellOutcomeResolution-N-MEGA7B.test.ts',
  'src\core\rulesets\spellMultiTargetResolution-N-MEGA7C.test.ts',
  'src\core\rulesets\spellOngoingEffectRuntime-N-MEGA7D.test.ts',
  'src\core\rulesets\inventoryActionRuntime-N-MEGA8.test.ts',
  'src\core\rulesets\multiclassAdvancementRuntime-N-MEGA9.test.ts',
  'src\core\rulesets\playStatusRuntime-N-MEGA10.test.ts',
  'src\core\runtime\guidedFeatureRuntime-N-MEGA11.test.ts'
)
$missing = @($required | Where-Object { -not (Test-Path (Join-Path $Root $_)) })
if ($missing.Count -gt 0) {
  Write-Host 'N-MEGA12 RED - PREFLIGHT'
  $missing | ForEach-Object { Write-Host "Missing: $_" }
  exit 3
}

Invoke-Gate -Name '01_GIT_DIFF_CHECK' -CommandLine 'git diff --check'
Invoke-Gate -Name '02_LINT' -CommandLine 'npm.cmd run lint'
Invoke-Gate -Name '03_UNIT_INTEGRATION' -CommandLine 'npm.cmd exec vitest run'
Invoke-Gate -Name '04_BUILD' -CommandLine 'npm.cmd run build'

# Run available project gates only when the package script exists.
$pkg = Get-Content (Join-Path $Root 'package.json') -Raw | ConvertFrom-Json
$scripts = $pkg.scripts
function Has-Script([string]$name) { return $null -ne $scripts.PSObject.Properties[$name] }

if (Has-Script 'audit:security-context') {
  Invoke-Gate -Name '05_SECURITY_CONTEXT' -CommandLine 'npm.cmd run audit:security-context'
}
if (Has-Script 'audit:bundle-performance') {
  Invoke-Gate -Name '06_BUNDLE_PERFORMANCE' -CommandLine 'npm.cmd run audit:bundle-performance'
}

Invoke-Gate -Name '07_E2E' -CommandLine 'npm.cmd exec playwright test'

$summary = [ordered]@{
  schemaVersion = 1
  generatedAt = (Get-Date).ToString('o')
  status = 'GREEN'
  gates = @(
    'git-diff-check',
    'lint',
    'unit-integration',
    'build',
    'optional-security-context',
    'optional-bundle-performance',
    'playwright-e2e'
  )
}
$summary | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 (Join-Path $ReportDir 'N_MEGA12_FINAL_CERTIFICATION.json')
@"
# N-MEGA12 Final Certification

Status: **GREEN**

Generated: $($summary.generatedAt)

All configured final gates completed successfully. Detailed stdout/stderr logs are stored under `certification-reports/n-mega12/logs`.
"@ | Set-Content -Encoding UTF8 (Join-Path $ReportDir 'N_MEGA12_FINAL_CERTIFICATION.md')

Write-Host 'N-MEGA12 HOTFIX2 FINAL GREEN'
