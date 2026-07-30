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

$badApplied = From-Codes @(117,121,103,117,108,97,110,100,196,177)
$goodApplied = From-Codes @(117,121,103,117,108,97,110,100,305)

$badHealing = From-Codes @(196,176,121,105,108,101,197,159,116,105,114,109,101)
$goodHealing = From-Codes @(304,121,105,108,101,351,116,105,114,109,101)

$badOperation = From-Codes @(105,197,159,108,101,109)
$goodOperation = From-Codes @(105,351,108,101,109)

$badCapitalOperation = From-Codes @(196,176,197,159,108,101,109)
$goodCapitalOperation = From-Codes @(304,351,108,101,109)

$badReceived = From-Codes @(97,108,196,177,110,100,196,177)
$goodReceived = From-Codes @(97,108,305,110,100,305)

$pairs = @(
  @($badHealing, $goodHealing),
  @($badCapitalOperation, $goodCapitalOperation),
  @($badOperation, $goodOperation),
  @($badApplied, $goodApplied),
  @($badReceived, $goodReceived)
)

$total = 0

foreach ($pair in $pairs) {
  $before = [string]$pair[0]
  $after = [string]$pair[1]

  if ($content.Contains($before)) {
    $count = ([regex]::Matches($content, [regex]::Escape($before))).Count
    $content = $content.Replace($before, $after)
    $total += $count
    Write-Host "Replaced occurrences: $count"
  }
}

if ($total -eq 0) {
  throw "No target mojibake strings found in PlayMode.tsx"
}

foreach ($pair in $pairs) {
  $bad = [string]$pair[0]
  if ($content.Contains($bad)) {
    throw "A mojibake string still remains in PlayMode.tsx"
  }
}

[System.IO.File]::WriteAllText(
  $Target,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "PlayMode source fixed. Total replacements: $total"
Write-Host ""
Write-Host "BUILD START"

& npm.cmd run build
$buildCode = $LASTEXITCODE

if ($buildCode -ne 0) {
  Write-Host "N-MEGA12 HOTFIX17 RED - BUILD exit=$buildCode"
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
  Write-Host "N-MEGA12 HOTFIX17 RED - E2E exit=$testCode"
  exit $testCode
}

Write-Host ""
Write-Host "N-MEGA12 HOTFIX17 PLAY FEEDBACK GREEN"
