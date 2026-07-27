$ErrorActionPreference = "Stop"

Write-Host "v5.110D2 Equipment & Combat E2E Visible Scope Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-e2e-visible-scope-hotfix-v5-110D2.mjs

if ($LASTEXITCODE -ne 0) {
    throw "v5.110D2 patch script başarısız oldu. E2E testleri başlatılmadı."
}

npm.cmd run certify:equipment-combat:e2e

if ($LASTEXITCODE -ne 0) {
    throw "v5.110D2 E2E sertifikasyonu başarısız oldu."
}

Write-Host "v5.110D2 Equipment & Combat E2E sertifikasyonu başarılı." -ForegroundColor Green
