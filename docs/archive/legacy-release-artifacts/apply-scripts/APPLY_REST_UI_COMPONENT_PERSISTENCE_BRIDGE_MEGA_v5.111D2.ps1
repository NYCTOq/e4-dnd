$ErrorActionPreference = "Stop"

Write-Host "v5.111D2 Rest UI Component Persistence Bridge Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-ui-component-persistence-v5-111D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D2 kurulum başarısız oldu."
}

npm.cmd run certify:rest-ui:component-foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D2 component foundation sertifikasyonu başarısız oldu."
}

node .\scripts\generate-rest-ui-component-report-v5-111D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D2 raporu üretilemedi."
}

Write-Host "v5.111D2 Rest UI component ve persistence bridge başarılı." -ForegroundColor Green
