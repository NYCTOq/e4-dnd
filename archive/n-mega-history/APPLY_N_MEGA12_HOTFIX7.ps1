$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Targets = @(
  'e2e\certification-all-ancestries.spec.ts',
  'e2e\certification-all-classes-backgrounds.spec.ts'
)

foreach ($relative in $Targets) {
  $file = Join-Path $Root $relative
  if (-not (Test-Path $file)) {
    throw "Test dosyasi bulunamadi: $relative"
  }

  $content = [System.IO.File]::ReadAllText($file)
  $old = 'page.getByRole("form", { name: /Race & Class/i })'
  $new = 'page.locator("#builder-step-panel")'

  if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
  }

  if ($content.Contains('getByRole("form", { name: /Race & Class/i })')) {
    throw "Eski Race & Class form locator temizlenemedi: $relative"
  }

  [System.IO.File]::WriteAllText(
    $file,
    $content,
    [System.Text.UTF8Encoding]::new($false)
  )
}

Write-Host 'Builder form locatorlari guncellendi.'

Write-Host ''
Write-Host 'FOCUSED E2E BASLIYOR'
& npm.cmd exec playwright test -- `
  e2e/builder-ui-mega.spec.ts `
  e2e/certification-all-ancestries.spec.ts `
  e2e/certification-all-classes-backgrounds.spec.ts `
  --project=desktop-chromium `
  --workers=1 `
  --max-failures=5

$code = $LASTEXITCODE
if ($code -ne 0) {
  Write-Host "N-MEGA12 HOTFIX7 RED (exit=$code)"
  exit $code
}

Write-Host 'N-MEGA12 HOTFIX7 FOCUSED GREEN'
