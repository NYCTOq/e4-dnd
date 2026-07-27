$ErrorActionPreference = "Stop"
Write-Host "v5.107.1 Class/Background E2E step hotfix uygulanıyor..." -ForegroundColor Cyan
npm.cmd run certify:class-background:e2e
