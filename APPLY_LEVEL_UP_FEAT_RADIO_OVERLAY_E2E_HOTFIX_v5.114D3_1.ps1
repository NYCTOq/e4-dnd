$ErrorActionPreference = "Stop"

Write-Host "v5.114D3.1 Level-Up Feat Radio Overlay E2E Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-feat-radio-overlay-e2e-hotfix-v5-114D3-1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D3.1 patch script başarısız oldu."
}

npm.cmd run certify:level-up:closure:hotfix
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D3.1 E2E final closure doğrulaması başarısız oldu."
}

Write-Host "v5.114D3.1 Level-Up Progression UI domain tamamen kapandı." -ForegroundColor Green
