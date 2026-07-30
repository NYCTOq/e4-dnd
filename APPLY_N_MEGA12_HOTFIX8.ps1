$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Targets = @(
  'e2e\certification-all-ancestries.spec.ts',
  'e2e\certification-all-classes-backgrounds.spec.ts'
)

$pattern = 'page\.getByRole\(\s*["'']form["'']\s*,\s*\{\s*name\s*:\s*/Race\s*&\s*Class/i\s*\}\s*\)'

foreach ($relative in $Targets) {
  $file = Join-Path $Root $relative
  if (-not (Test-Path $file)) {
    throw "Test dosyasi bulunamadi: $relative"
  }

  $content = [System.IO.File]::ReadAllText($file)
  $matches = [System.Text.RegularExpressions.Regex]::Matches($content, $pattern)

  if ($matches.Count -gt 0) {
    $content = [System.Text.RegularExpressions.Regex]::Replace(
      $content,
      $pattern,
      'page.locator("#builder-step-panel")'
    )
  }

  if ([System.Text.RegularExpressions.Regex]::IsMatch($content, $pattern)) {
    throw "Eski Race & Class locator kaldi: $relative"
  }

  [System.IO.File]::WriteAllText(
    $file,
    $content,
    [System.Text.UTF8Encoding]::new($false)
  )

  Write-Host "$relative guncellendi; replacement=$($matches.Count)"
}

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
  Write-Host "N-MEGA12 HOTFIX8 RED (exit=$code)"
  exit $code
}

Write-Host 'N-MEGA12 HOTFIX8 FOCUSED GREEN'
