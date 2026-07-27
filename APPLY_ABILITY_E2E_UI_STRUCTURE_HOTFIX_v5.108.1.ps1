$ErrorActionPreference = "Stop"
Write-Host "v5.108.1 Ability E2E UI Structure Hotfix uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-ability-e2e-ui-hotfix-v5-108-1.mjs
npm.cmd run certify:ability:e2e
