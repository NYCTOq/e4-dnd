$ErrorActionPreference = "Stop"

Write-Host "v5.110D3 Equipment & Combat E2E Item Scope Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-e2e-item-scope-hotfix-v5-110D3.mjs

if ($LASTEXITCODE -ne 0) {
    throw "v5.110D3 patch script başarısız oldu. E2E testleri başlatılmadı."
}

npm.cmd run certify:equipment-combat:e2e

if ($LASTEXITCODE -ne 0) {
    throw "v5.110D3 E2E sertifikasyonu başarısız oldu."
}

Write-Host "v5.110D3 Equipment & Combat E2E sertifikasyonu başarılı." -ForegroundColor Green
