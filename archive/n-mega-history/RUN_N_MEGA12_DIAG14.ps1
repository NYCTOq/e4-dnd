$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Output = Join-Path $Root 'N_MEGA12_FEEDBACK_ENCODING_DIAG.txt'
$SearchRoots = @(
  (Join-Path $Root 'src'),
  (Join-Path $Root 'e2e')
) | Where-Object { Test-Path $_ }

$Patterns = @(
  'hasar',
  'İyileştirme',
  'iyileştirme',
  'uygulandı',
  'uyguland',
  'play-action-feedback',
  'decodeURIComponent',
  'encodeURIComponent',
  'TextDecoder',
  'TextEncoder',
  'escape(',
  'unescape(',
  'atob(',
  'btoa('
)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("N-MEGA12 FEEDBACK ENCODING DIAGNOSTIC")
$lines.Add("Generated: $((Get-Date).ToString('o'))")
$lines.Add("Root: $Root")
$lines.Add("")

foreach ($searchRoot in $SearchRoots) {
  $files = Get-ChildItem $searchRoot -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.json,*.html
  foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $split = $content -split "`r?`n"
    for ($i = 0; $i -lt $split.Count; $i++) {
      $line = $split[$i]
      $matched = $false
      foreach ($pattern in $Patterns) {
        if ($line.IndexOf($pattern, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
          $matched = $true
          break
        }
      }
      if ($matched) {
        $relative = $file.FullName.Substring($Root.Length + 1)
        $start = [Math]::Max(0, $i - 2)
        $end = [Math]::Min($split.Count - 1, $i + 2)
        $lines.Add("===== $relative:$($i + 1) =====")
        for ($j = $start; $j -le $end; $j++) {
          $marker = if ($j -eq $i) { '>>' } else { '  ' }
          $lines.Add(("{0} {1,5}: {2}" -f $marker, ($j + 1), $split[$j]))
        }
        $lines.Add("")
      }
    }
  }
}

# Inspect built JS too, because the corruption may occur during generated output.
$Dist = Join-Path $Root 'dist'
if (Test-Path $Dist) {
  $files = Get-ChildItem $Dist -Recurse -File -Include *.js,*.html
  foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    foreach ($needle in @('uygulandÄ±','Ä°yileÅŸtirme','uygulandı','İyileştirme')) {
      $index = $content.IndexOf($needle, [System.StringComparison]::Ordinal)
      if ($index -ge 0) {
        $relative = $file.FullName.Substring($Root.Length + 1)
        $start = [Math]::Max(0, $index - 180)
        $length = [Math]::Min(500, $content.Length - $start)
        $lines.Add("===== DIST MATCH $relative :: $needle =====")
        $lines.Add($content.Substring($start, $length))
        $lines.Add("")
      }
    }
  }
}

[System.IO.File]::WriteAllLines(
  $Output,
  $lines,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host ''
Write-Host 'DIAGNOSTIC COMPLETE'
Write-Host "Rapor: $Output"
Write-Host ''
Get-Content $Output -Encoding UTF8
