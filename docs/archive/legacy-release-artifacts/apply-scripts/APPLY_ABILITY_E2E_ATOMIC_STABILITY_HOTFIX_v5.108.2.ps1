$ErrorActionPreference = "Stop"
Write-Host "v5.108.2 Ability E2E Atomic Stability Hotfix uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-ability-e2e-atomic-stability-v5-108-2.mjs
npm.cmd run certify:ability:e2e
