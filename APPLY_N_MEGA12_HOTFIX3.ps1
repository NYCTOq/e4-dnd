$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$PlayMode = Join-Path $Root 'src\features\play-mode\PlayMode.tsx'
if (-not (Test-Path $PlayMode)) {
  throw "PlayMode.tsx bulunamadi: $PlayMode"
}

# Normalize only the file ending: remove trailing whitespace/blank lines,
# then write exactly one newline at EOF. Preserve the rest of the file.
$content = [System.IO.File]::ReadAllText($PlayMode)
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '(\r?\n[ \t]*)+\z', '')
[System.IO.File]::WriteAllText(
  $PlayMode,
  $content + [Environment]::NewLine,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host 'PlayMode EOF temizlendi.'

$FinalScript = Join-Path $Root 'APPLY_N_MEGA12_HOTFIX2.ps1'
if (-not (Test-Path $FinalScript)) {
  throw "Final sertifikasyon scripti bulunamadi: $FinalScript"
}

& powershell -ExecutionPolicy Bypass -File $FinalScript
$code = $LASTEXITCODE
if ($code -ne 0) {
  exit $code
}

Write-Host 'N-MEGA12 HOTFIX3 FINAL GREEN'
