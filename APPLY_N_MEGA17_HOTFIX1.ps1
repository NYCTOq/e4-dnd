$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Target = Join-Path $Root 'APPLY_N_MEGA17.ps1'
if (-not (Test-Path $Target)) {
  throw "Target not found: $Target"
}

$content = [System.IO.File]::ReadAllText($Target)

$old = @'
  if (-not $content.Contains($Old)) {
    throw "Expected block not found in: $Path"
  }

  $content = $content.Replace($Old, $New)
'@

$new = @'
  if ($content.Contains($New)) {
    Write-Host "Already applied: $Path"
    return
  }

  if (-not $content.Contains($Old)) {
    throw "Neither original nor updated block found in: $Path"
  }

  $content = $content.Replace($Old, $New)
'@

if ($content.Contains($new)) {
  Write-Host 'N-MEGA17 script is already idempotent.'
} elseif ($content.Contains($old)) {
  $content = $content.Replace($old, $new)

  [System.IO.File]::WriteAllText(
    $Target,
    $content,
    [System.Text.UTF8Encoding]::new($false)
  )

  Write-Host 'N-MEGA17 HOTFIX1 installed.'
} else {
  throw 'Expected Replace-Exact implementation not found.'
}

Write-Host ''
Write-Host 'RESTARTING N-MEGA17'
Write-Host ''

& powershell.exe -ExecutionPolicy Bypass -File $Target
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
  Write-Host "N-MEGA17 HOTFIX1 RED - delegated exit=$exitCode"
  exit $exitCode
}

Write-Host ''
Write-Host 'N-MEGA17 HOTFIX1 GREEN'
