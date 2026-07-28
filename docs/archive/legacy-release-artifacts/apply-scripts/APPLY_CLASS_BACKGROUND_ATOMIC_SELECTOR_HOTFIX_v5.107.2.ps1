$ErrorActionPreference = "Stop"
Write-Host "v5.107.2 Atomic Selector Hotfix uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-class-background-atomic-hotfix-v5-107-2.mjs
npm.cmd run certify:class-background:e2e
