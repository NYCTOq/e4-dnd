$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Target = Join-Path $Root 'src\certification\matrix\classSubclassPersistenceMatrix.test.ts'
if (-not (Test-Path $Target)) {
  throw "Hedef test dosyasi bulunamadi: $Target"
}

$content = [System.IO.File]::ReadAllText($Target)

$old = @'
    expect(
      (restored.classFeatures?.[0] as unknown as Record<string, unknown>)
        .customEffect,
'@

$new = @'
    const restoredFeature = restored.classFeatures?.[0] as
      | Record<string, unknown>
      | undefined;

    expect(
      restoredFeature?.customEffect,
'@

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
} elseif (-not $content.Contains('restoredFeature?.customEffect')) {
  throw 'Lint hata blogu bulunamadi; dosya beklenen yapida degil.'
}

[System.IO.File]::WriteAllText(
  $Target,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host 'Unsafe optional chaining lint hatasi duzeltildi.'

$FinalScript = Join-Path $Root 'APPLY_N_MEGA12_HOTFIX3.ps1'
if (-not (Test-Path $FinalScript)) {
  throw "Final sertifikasyon scripti bulunamadi: $FinalScript"
}

& powershell -ExecutionPolicy Bypass -File $FinalScript
$code = $LASTEXITCODE
if ($code -ne 0) {
  exit $code
}

Write-Host 'N-MEGA12 HOTFIX4 FINAL GREEN'
