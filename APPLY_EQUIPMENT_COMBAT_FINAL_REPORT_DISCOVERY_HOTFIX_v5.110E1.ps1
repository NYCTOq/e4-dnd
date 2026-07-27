$ErrorActionPreference = "Stop"

Write-Host "v5.110E1 Final Report Discovery Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-final-report-discovery-hotfix-v5-110E1.mjs

if ($LASTEXITCODE -ne 0) {
    throw "v5.110E1 patch script başarısız oldu."
}

npm.cmd run certify:equipment-combat:final:audit

if ($LASTEXITCODE -ne 0) {
    throw "v5.110E1 final audit başarısız oldu."
}

Write-Host "v5.110E1 Equipment & Combat domain tamamen kapandı." -ForegroundColor Green
Write-Host "Sertifikalı toplam: 573 test (569 core + 4 E2E)." -ForegroundColor Green
