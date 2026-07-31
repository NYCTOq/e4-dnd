$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Target = Join-Path $Root 'APPLY_N_MEGA16.ps1'
if (-not (Test-Path $Target)) {
  throw "Target not found: $Target"
}

$content = [System.IO.File]::ReadAllText($Target)

$old = @'
Write-Host 'LINT AUDIT START'
$lintOutput = & npm.cmd run lint 2>&1
$lintExit = $LASTEXITCODE
$lintOutput | Tee-Object -FilePath $LintLog | ForEach-Object { Write-Host $_ }
'@

$new = @'
Write-Host 'LINT AUDIT START'
$lintTemp = Join-Path $env:TEMP 'e4-dnd-nmega16-lint.txt'
if (Test-Path $lintTemp) {
  Remove-Item $lintTemp -Force
}

& cmd.exe /d /s /c "npm.cmd run lint > `"$lintTemp`" 2>&1"
$lintExit = $LASTEXITCODE

$lintOutput = if (Test-Path $lintTemp) {
  Get-Content $lintTemp
} else {
  @()
}

$lintOutput | Tee-Object -FilePath $LintLog | ForEach-Object { Write-Host $_ }

if (Test-Path $lintTemp) {
  Remove-Item $lintTemp -Force
}
'@

if (-not $content.Contains($old)) {
  throw 'Expected N-MEGA16 lint block not found.'
}

$content = $content.Replace($old, $new)

[System.IO.File]::WriteAllText(
  $Target,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host 'N-MEGA16 HOTFIX1 installed.'
Write-Host ''
Write-Host 'RESTARTING N-MEGA16'
Write-Host ''

& powershell.exe -ExecutionPolicy Bypass -File $Target
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
  Write-Host "N-MEGA16 HOTFIX1 RED - delegated exit=$exitCode"
  exit $exitCode
}

Write-Host ''
Write-Host 'N-MEGA16 HOTFIX1 GREEN'
