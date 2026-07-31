$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$PackageFile = Join-Path $Root 'package.json'
if (-not (Test-Path $PackageFile)) {
  throw "package.json bulunamadi."
}

$Package = Get-Content $PackageFile -Raw | ConvertFrom-Json
$Version = [string]$Package.version
if ([string]::IsNullOrWhiteSpace($Version)) {
  throw "package.json version okunamadi."
}

$E2eRoot = Join-Path $Root 'e2e'
$Files = Get-ChildItem $E2eRoot -Recurse -File -Include *.ts,*.tsx
$ChangedFiles = 0
$ReplacementCount = 0

foreach ($file in $Files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  # Update deterministic shell bootstrap constants.
  $content = [System.Text.RegularExpressions.Regex]::Replace(
    $content,
    'const\s+__E4_E2E_APP_VERSION__\s*=\s*["''][^"'']+["'']\s*;',
    "const __E4_E2E_APP_VERSION__ = `"$Version`";"
  )

  # Update direct last-seen version writes.
  $content = [System.Text.RegularExpressions.Regex]::Replace(
    $content,
    '(localStorage\.setItem\(\s*["'']e4_dnd_last_seen_version_v1["'']\s*,\s*)["''][^"'']+["''](\s*\))',
    ('$1"' + $Version + '"$2')
  )

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText(
      $file.FullName,
      $content,
      [System.Text.UTF8Encoding]::new($false)
    )
    $ChangedFiles++
  }
}

# Verify no stale 6.1.0 bootstrap remains for the release-notes key.
$stale = Select-String `
  -Path (Join-Path $E2eRoot '*') `
  -Pattern 'e4_dnd_last_seen_version_v1.*6\.1\.0|__E4_E2E_APP_VERSION__\s*=\s*["'']6\.1\.0' `
  -Recurse `
  -ErrorAction SilentlyContinue

if ($stale) {
  Write-Host 'Stale E2E release bootstrap kayitlari:'
  $stale | ForEach-Object { Write-Host $_.Path ':' $_.LineNumber ':' $_.Line }
  throw 'Eski 6.1.0 release bootstrap kayitlari temizlenemedi.'
}

Write-Host "E2E release bootstrap version=$Version; changedFiles=$ChangedFiles"
Write-Host ''
Write-Host 'FOCUSED BUILDER E2E BASLIYOR'

& npm.cmd exec playwright test -- `
  e2e/certification-all-ancestries.spec.ts `
  e2e/certification-all-classes-backgrounds.spec.ts `
  --project=desktop-chromium `
  --workers=1 `
  --max-failures=5

$code = $LASTEXITCODE
if ($code -ne 0) {
  Write-Host "N-MEGA12 HOTFIX11 RED (exit=$code)"
  exit $code
}

Write-Host 'N-MEGA12 HOTFIX11 BUILDER CATALOG GREEN'
