$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
    throw "Bu script D:\Projects\e4_dnd proje kökünde çalıştırılmalıdır."
}

Write-Host "Global Shell release-version E2E hotfix doğrulanıyor..." -ForegroundColor Cyan
npm.cmd run certify:shell-overlay:e2e

if ($LASTEXITCODE -ne 0) {
    throw "Global Shell overlay E2E doğrulaması başarısız oldu."
}

Write-Host "v5.117D1 hotfix GREEN." -ForegroundColor Green
