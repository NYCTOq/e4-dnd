$ErrorActionPreference = "Stop"

Write-Host "v5.111D1 Rest UI Integration Discovery Contract Gate uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-ui-integration-contract-v5-111D1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D1 kurulum scripti başarısız oldu."
}

npm.cmd run certify:rest-ui:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D1 UI integration contract gate başarısız oldu."
}

Write-Host "v5.111D1 Rest UI integration contract hazır." -ForegroundColor Green
Write-Host "Rapor certification-reports klasörüne yazıldı." -ForegroundColor Green
