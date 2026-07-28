$ErrorActionPreference = 'Stop'
Write-Host 'E4 D&D v5.135D2 package.json UTF-8 encoding hotfix starting...'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$packagePath = Join-Path $projectRoot 'package.json'
if (-not (Test-Path $packagePath)) {
  throw 'package.json not found.'
}

# Read bytes first so UTF-16 LE/BE and UTF-8 BOM files are handled safely.
$bytes = [System.IO.File]::ReadAllBytes($packagePath)
if ($bytes.Length -eq 0) {
  throw 'package.json is empty.'
}

if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
  $jsonText = [System.Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
} elseif ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
  $jsonText = [System.Text.Encoding]::BigEndianUnicode.GetString($bytes, 2, $bytes.Length - 2)
} elseif ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
  $jsonText = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
} else {
  $jsonText = [System.Text.Encoding]::UTF8.GetString($bytes)
}

try {
  $package = $jsonText | ConvertFrom-Json
} catch {
  throw "package.json could not be parsed before repair: $($_.Exception.Message)"
}

$package.version = '5.135.2'
$normalizedJson = $package | ConvertTo-Json -Depth 100
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($packagePath, $normalizedJson + [Environment]::NewLine, $utf8NoBom)

# Verify the exact bytes and JSON parse after writing.
$verifyBytes = [System.IO.File]::ReadAllBytes($packagePath)
if ($verifyBytes.Length -eq 0) { throw 'package.json became empty after repair.' }
if ($verifyBytes.Length -ge 2 -and (($verifyBytes[0] -eq 0xFF -and $verifyBytes[1] -eq 0xFE) -or ($verifyBytes[0] -eq 0xFE -and $verifyBytes[1] -eq 0xFF))) {
  throw 'package.json is still UTF-16 after repair.'
}
Get-Content -Raw -Encoding UTF8 $packagePath | ConvertFrom-Json | Out-Null
Write-Host 'package.json repaired as UTF-8 without BOM. Version: 5.135.2'

npm.cmd run certify:playable-gap-closure
if ($LASTEXITCODE -ne 0) {
  throw 'v5.135D2 Playable Gap Closure certification failed.'
}

Write-Host 'v5.135D2 GREEN - Playable Gap Closure closed; next target: Full Regression & Release Candidate v5.136.'
