$ErrorActionPreference = "Stop"
Write-Host "E4 D&D M-MEGA1d GitHub Release Not-Found Repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

Write-Host ""
Write-Host "[1/3] Repair non-fatal missing GitHub Release check" -ForegroundColor Yellow
node ".\scripts\repair-github-release-not-found-M-MEGA1D.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "GitHub Release existence check repair failed."
}

Write-Host ""
Write-Host "[2/3] Verify GitHub CLI authentication" -ForegroundColor Yellow
gh auth status
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI authentication is not active."
}

Write-Host ""
Write-Host "[3/3] Publish GitHub Release v6.2.0" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\PUBLISH_GITHUB_RELEASE_M_MEGA1.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "M-MEGA1d GREEN - GitHub Release v6.2.0 and release assets were published." -ForegroundColor Green
