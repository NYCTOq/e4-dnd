$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$SourceRoot = Join-Path $Root 'src'
if (-not (Test-Path $SourceRoot)) {
  throw "src klasoru bulunamadi."
}

$Replacements = [ordered]@{
  'Ä°yileÅŸtirme uygulandÄ±' = 'İyileştirme uygulandı'
  'Ä°yileÅŸtirme' = 'İyileştirme'
  'uygulandÄ±' = 'uygulandı'
  'iyileÅŸtirme' = 'iyileştirme'
  'hasar uygulandÄ±' = 'hasar uygulandı'
  'HPÄ°yileÅŸtirme' = 'HP İyileştirme'
}

$Files = Get-ChildItem $SourceRoot -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.json,*.css,*.html
$Changed = @()
$Counts = @{}

foreach ($file in $Files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  foreach ($entry in $Replacements.GetEnumerator()) {
    $before = $entry.Key
    $after = $entry.Value
    if ($content.Contains($before)) {
      $count = ([regex]::Matches($content, [regex]::Escape($before))).Count
      $content = $content.Replace($before, $after)
      if (-not $Counts.ContainsKey($before)) { $Counts[$before] = 0 }
      $Counts[$before] += $count
    }
  }

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText(
      $file.FullName,
      $content,
      [System.Text.UTF8Encoding]::new($false)
    )
    $Changed += $file.FullName.Substring($Root.Length + 1)
  }
}

if ($Changed.Count -eq 0) {
  Write-Host 'Bilinen feedback mojibake metni bulunamadi; mevcut dosyalar kontrol ediliyor.'
}

$Remaining = Get-ChildItem $SourceRoot -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -SimpleMatch -Pattern 'uygulandÄ±','Ä°yileÅŸtirme'

if ($Remaining) {
  Write-Host 'Kalan bozuk feedback metinleri:'
  $Remaining | ForEach-Object {
    Write-Host "$($_.Path):$($_.LineNumber):$($_.Line)"
  }
  throw 'Feedback mojibake metinleri tamamen temizlenemedi.'
}

Write-Host "UTF-8 feedback metinleri duzeltildi; changedFiles=$($Changed.Count)"
$Changed | ForEach-Object { Write-Host "  $_" }

Write-Host ''
Write-Host 'PLAY FEEDBACK FOCUSED E2E BASLIYOR'

& npm.cmd exec playwright test -- `
  e2e/play-feedback-undo-v5.124.spec.ts `
  --workers=2

$code = $LASTEXITCODE
if ($code -ne 0) {
  Write-Host "N-MEGA12 HOTFIX13 RED (exit=$code)"
  exit $code
}

Write-Host 'N-MEGA12 HOTFIX13 PLAY FEEDBACK GREEN'
