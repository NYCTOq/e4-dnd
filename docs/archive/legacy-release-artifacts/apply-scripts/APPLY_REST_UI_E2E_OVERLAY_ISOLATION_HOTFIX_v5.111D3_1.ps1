$ErrorActionPreference = "Stop"

Write-Host "v5.111D3.1 Rest UI E2E Overlay Isolation Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-ui-e2e-overlay-isolation-v5-111D3-1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D3.1 patch script başarısız oldu."
}

npm.cmd run certify:rest-ui:e2e
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D3.1 Rest UI E2E başarısız oldu."
}

node .\scripts\audit-rest-recovery-final-closure-v5-111D3.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D3.1 final closure audit başarısız oldu."
}

Write-Host "v5.111D3.1 Rest Recovery final closure başarılı." -ForegroundColor Green
Write-Host "Rest, Recovery & Resource domain tamamen kapandı." -ForegroundColor Green
