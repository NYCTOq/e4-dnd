$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Target = Join-Path $Root 'src\features\play-mode\PlayMode.tsx'
if (-not (Test-Path $Target)) {
  throw "PlayMode.tsx not found: $Target"
}

function From-Codes([int[]]$Codes) {
  return -join ($Codes | ForEach-Object { [char]$_ })
}

$content = [System.IO.File]::ReadAllText($Target)

# Exact mojibake:
# A-diaeresis + degree + yile + A-ring + Y-diaeresis + tirme
$badHealing = From-Codes @(196,176,121,105,108,101,197,376,116,105,114,109,101)

# Correct Turkish:
# capital dotted I + yile + s-cedilla + tirme
$goodHealing = From-Codes @(304,121,105,108,101,351,116,105,114,109,101)

$count = ([regex]::Matches($content, [regex]::Escape($badHealing))).Count

if ($count -eq 0) {
  throw "Exact healing mojibake string not found in PlayMode.tsx"
}

$content = $content.Replace($badHealing, $goodHealing)

if ($content.Contains($badHealing)) {
  throw "Healing mojibake string still remains in PlayMode.tsx"
}

[System.IO.File]::WriteAllText(
  $Target,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Healing label fixed. Replacements: $count"
Write-Host ""
Write-Host "BUILD START"

& npm.cmd run build
$buildCode = $LASTEXITCODE

if ($buildCode -ne 0) {
  Write-Host "N-MEGA12 HOTFIX18 RED - BUILD exit=$buildCode"
  exit $buildCode
}

Write-Host "BUILD GREEN"
Write-Host ""
Write-Host "FOCUSED E2E START"

& npm.cmd exec playwright test -- `
  e2e/play-feedback-undo-v5.124.spec.ts `
  --workers=2

$testCode = $LASTEXITCODE

if ($testCode -ne 0) {
  Write-Host "N-MEGA12 HOTFIX18 RED - E2E exit=$testCode"
  exit $testCode
}

Write-Host ""
Write-Host "N-MEGA12 HOTFIX18 PLAY FEEDBACK GREEN"
