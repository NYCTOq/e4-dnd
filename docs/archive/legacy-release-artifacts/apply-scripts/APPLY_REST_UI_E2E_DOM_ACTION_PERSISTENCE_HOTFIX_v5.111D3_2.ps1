$ErrorActionPreference = "Stop"

Write-Host "v5.111D3.2 Rest UI E2E DOM Action Persistence Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-ui-e2e-dom-action-v5-111D3-2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D3.2 patch script başarısız oldu."
}

npm.cmd run certify:rest-ui:e2e
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D3.2 Rest UI E2E başarısız oldu."
}

node .\scripts\audit-rest-recovery-final-closure-v5-111D3.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D3.2 final closure audit başarısız oldu."
}

Write-Host "v5.111D3.2 Rest Recovery final closure başarılı." -ForegroundColor Green
Write-Host "Rest, Recovery & Resource domain tamamen kapandı." -ForegroundColor Green
