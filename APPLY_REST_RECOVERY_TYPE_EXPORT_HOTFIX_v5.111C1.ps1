$ErrorActionPreference = "Stop"

Write-Host "v5.111C1 Rest Recovery Type Export Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-recovery-type-export-hotfix-v5-111C1.mjs

if ($LASTEXITCODE -ne 0) {
    throw "v5.111C1 patch script başarısız oldu."
}

npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    throw "v5.111C1 production build başarısız oldu."
}

npm.cmd run certify:rest-recovery:runtime:report

if ($LASTEXITCODE -ne 0) {
    throw "v5.111C1 runtime raporu üretilemedi."
}

npm.cmd run certify:rest-recovery:golden:report

if ($LASTEXITCODE -ne 0) {
    throw "v5.111C1 golden raporu üretilemedi."
}

Write-Host "v5.111C1 build ve rapor zinciri başarılı." -ForegroundColor Green
Write-Host "v5.111C Golden Character Integration tamamen kapandı." -ForegroundColor Green
