$ErrorActionPreference = "Stop"

Write-Host "v5.114D2 Level-Up Panel Persistence ASI Feat Subclass Flow Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-panel-v5-114D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D2 kurulum başarısız oldu."
}

npm.cmd run certify:level-up:ui:component-foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D2 component foundation başarısız oldu."
}

node .\scripts\generate-level-up-panel-report-v5-114D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D2 raporu üretilemedi."
}

Write-Host "v5.114D2 Level-Up panel foundation tamamen başarılı." -ForegroundColor Green
