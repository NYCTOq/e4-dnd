$ErrorActionPreference = "Stop"

Write-Host "v5.112D2 Class Feature Panel Persistence Bridge Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-class-feature-panel-v5-112D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D2 kurulum başarısız oldu."
}

npm.cmd run certify:class-subclass:ui:component-foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D2 component foundation başarısız oldu."
}

node .\scripts\generate-class-feature-panel-report-v5-112D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D2 raporu üretilemedi."
}

Write-Host "v5.112D2 Class Feature Panel ve persistence bridge başarılı." -ForegroundColor Green
