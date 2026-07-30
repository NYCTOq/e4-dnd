param(
  [string]$Repository = "NYCTOq/e4-dnd",
  [string]$Tag = "v6.2.0",
  [string]$Title = "E4 D&D 6.2.0"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "E4 D&D GitHub Release publishing..." -ForegroundColor Cyan

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) bulunamadi. Once https://cli.github.com/ adresinden kur veya winget install --id GitHub.cli"
}

gh auth status
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI girisi aktif degil. Once gh auth login calistir."
}

$required = @(
  ".\release\E4_DND_6.2.0_PUBLIC.zip",
  ".\release\E4_DND_6.2.0_PUBLIC.sha256",
  ".\release\PUBLIC_RELEASE_ARCHIVE_K_MEGA1.json",
  ".\release\PUBLIC_ROLLBACK_RUNBOOK_K_MEGA1.md",
  ".\release\PUBLIC_RELEASE_NOTES_6.2.0.md"
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    throw "Gerekli release dosyasi eksik: $file"
  }
}

$releaseExists = $false
$previousErrorActionPreference = $ErrorActionPreference

try {
  $ErrorActionPreference = "Continue"
  gh release view $Tag --repo $Repository *> $null

  if ($LASTEXITCODE -eq 0) {
    $releaseExists = $true
  }
}
finally {
  $ErrorActionPreference = $previousErrorActionPreference
}

if (-not $releaseExists) {
  gh release create $Tag `
    --repo $Repository `
    --title $Title `
    --notes-file ".\release\PUBLIC_RELEASE_NOTES_6.2.0.md" `
    ".\release\E4_DND_6.2.0_PUBLIC.zip" `
    ".\release\E4_DND_6.2.0_PUBLIC.sha256" `
    ".\release\PUBLIC_RELEASE_ARCHIVE_K_MEGA1.json" `
    ".\release\PUBLIC_ROLLBACK_RUNBOOK_K_MEGA1.md"

  if ($LASTEXITCODE -ne 0) {
    throw "GitHub Release olusturulamadi."
  }
} else {
  gh release upload $Tag `
    --repo $Repository `
    --clobber `
    ".\release\E4_DND_6.2.0_PUBLIC.zip" `
    ".\release\E4_DND_6.2.0_PUBLIC.sha256" `
    ".\release\PUBLIC_RELEASE_ARCHIVE_K_MEGA1.json" `
    ".\release\PUBLIC_ROLLBACK_RUNBOOK_K_MEGA1.md"

  if ($LASTEXITCODE -ne 0) {
    throw "GitHub Release asset guncellemesi basarisiz."
  }

  gh release edit $Tag `
    --repo $Repository `
    --title $Title `
    --notes-file ".\release\PUBLIC_RELEASE_NOTES_6.2.0.md"

  if ($LASTEXITCODE -ne 0) {
    throw "GitHub Release aciklamasi guncellenemedi."
  }
}

gh release view $Tag --repo $Repository
if ($LASTEXITCODE -ne 0) {
  throw "GitHub Release dogrulanamadi."
}

Write-Host ""
Write-Host "GITHUB RELEASE GREEN - v6.2.0 release ve assetler yayinlandi." -ForegroundColor Green
