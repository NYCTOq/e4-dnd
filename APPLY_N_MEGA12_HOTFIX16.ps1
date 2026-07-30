$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Target = Join-Path $Root 'src\features\play-mode\PlayMode.tsx'
if (-not (Test-Path $Target)) {
  throw "PlayMode.tsx bulunamadi: $Target"
}

$content = [System.IO.File]::ReadAllText($Target)

function S([int[]]$codes) {
  return -join ($codes | ForEach-Object { [char]$_ })
}

# Mojibake strings are constructed from code points so PowerShell/file encoding
# cannot corrupt the patch itself.
$badApplied = S @(117,121,103,117,108,97,110,100,196,177)
$goodApplied = S @(117,121,103,117,108,97,110,100,305)

$badHealing = S @(196,176,121,105,108,101,197,159,116,105,114,109,101)
$goodHealing = S @(304,121,105,108,101,351,116,105,114,109,101)

$badOperation = S @(105,197,159,108,101,109)
$goodOperation = S @(105,351,108,101,109)

$badCapitalOperation = S @(196,176,197,159,108,101,109)
$goodCapitalOperation = S @(304,351,108,101,109)

$badReceived = S @(97,108,196,177,110,100,196,177)
$goodReceived = S @(97,108,305,110,100,305)

$map = [ordered]@{
  $badHealing = $goodHealing
  $badCapitalOperation = $goodCapitalOperation
  $badOperation = $goodOperation
  $badApplied = $goodApplied
  $badReceived = $goodReceived
  ' Â· ' = ' · '
}

$replacementTotal = 0
foreach ($entry in $map.GetEnumerator()) {
  $before = [string]$entry.Key
  $after = [string]$entry.Value
  if ($content.Contains($before)) {
    $count = ([regex]::Matches($content, [regex]::Escape($before))).Count
    $content = $content.Replace($before, $after)
    $replacementTotal += $count
    Write-Host "Duzeltildi: $count eslesme"
  }
}

if ($replacementTotal -eq 0) {
  throw 'PlayMode.tsx icinde hedef mojibake metinleri bulunamadi.'
}

foreach ($bad in @($badApplied, $badHealing, $badOperation, $badCapitalOperation, $badReceived)) {
  if ($content.Contains($bad)) {
    throw 'PlayMode.tsx icinde bozuk UTF-8 metni kaldi.'
  }
}

[System.IO.File]::WriteAllText(
  $Target,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "PlayMode UTF-8 kaynak duzeltmesi tamamlandi; replacements=$replacementTotal"
Write-Host ''
Write-Host 'BUILD BASLIYOR'

& npm.cmd run build
$buildCode = $LASTEXITCODE
if ($buildCode -ne 0) {
  Write-Host "N-MEGA12 HOTFIX16 RED - BUILD (exit=$buildCode)"
  exit $buildCode
}

Write-Host 'BUILD GREEN'
Write-Host ''
Write-Host 'PLAY FEEDBACK FOCUSED E2E BASLIYOR'

& npm.cmd exec playwright test -- `
  e2e/play-feedback-undo-v5.124.spec.ts `
  --workers=2

$testCode = $LASTEXITCODE
if ($testCode -ne 0) {
  Write-Host "N-MEGA12 HOTFIX16 RED - E2E (exit=$testCode)"
  exit $testCode
}

Write-Host ''
Write-Host 'N-MEGA12 HOTFIX16 PLAY FEEDBACK GREEN'
