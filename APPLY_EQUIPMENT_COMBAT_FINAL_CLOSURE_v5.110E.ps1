$ErrorActionPreference = "Stop"

Write-Host "v5.110E Equipment & Combat Final Closure uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-equipment-combat-final-closure-v5-110E.mjs

if ($LASTEXITCODE -ne 0) {
    throw "v5.110E kurulum scripti başarısız oldu."
}

npm.cmd run certify:equipment-combat:final

if ($LASTEXITCODE -ne 0) {
    throw "v5.110E final closure başarısız oldu."
}

Write-Host "v5.110E Equipment & Combat domain tamamen kapandı." -ForegroundColor Green
Write-Host "Sertifikalı toplam: 573 test (569 core + 4 E2E)." -ForegroundColor Green
