$ErrorActionPreference = "Stop"
Write-Host "Certification E2E selector hotfix uygulanıyor..." -ForegroundColor Cyan
npm.cmd run certify:builder
