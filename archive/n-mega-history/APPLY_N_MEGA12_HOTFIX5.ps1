$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Target = Join-Path $Root 'src\features\characters\InventoryEconomyPanel.tsx'
if (-not (Test-Path $Target)) {
  throw "InventoryEconomyPanel bulunamadi: $Target"
}

$content = [System.IO.File]::ReadAllText($Target)

# React Hooks lint names every use* call as a hook candidate. This runtime action
# is not a hook, so alias it at import/use sites without changing its implementation.
$importPattern = 'useInventoryItem\s*\}'
if ($content -match $importPattern) {
  $content = [System.Text.RegularExpressions.Regex]::Replace(
    $content,
    $importPattern,
    'useInventoryItem as executeInventoryItem }',
    1
  )
} elseif ($content -notmatch 'useInventoryItem\s+as\s+executeInventoryItem') {
  throw 'useInventoryItem import anchor bulunamadi.'
}

$content = $content.Replace(
  'apply(useInventoryItem(character,item))',
  'apply(executeInventoryItem(character,item))'
)

if ($content -match 'apply\(useInventoryItem\(') {
  throw 'Eski useInventoryItem cagrisi temizlenemedi.'
}
if ($content -notmatch 'executeInventoryItem\(character,item\)') {
  throw 'Yeni inventory action cagrisi yazilamadi.'
}

[System.IO.File]::WriteAllText(
  $Target,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host 'Inventory runtime hook-name lint hatasi duzeltildi.'

$FinalScript = Join-Path $Root 'APPLY_N_MEGA12_HOTFIX3.ps1'
if (-not (Test-Path $FinalScript)) {
  throw "Final sertifikasyon scripti bulunamadi: $FinalScript"
}

& powershell -ExecutionPolicy Bypass -File $FinalScript
$code = $LASTEXITCODE
if ($code -ne 0) {
  exit $code
}

Write-Host 'N-MEGA12 HOTFIX5 FINAL GREEN'
