$ErrorActionPreference = "Stop"

Write-Host "v5.112D2.1 Class Feature Panel Type Narrowing Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-class-feature-panel-type-narrowing-v5-112D2-1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D2.1 patch script başarısız oldu."
}

npm.cmd run certify:class-subclass:ui:component-foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D2.1 component foundation başarısız oldu."
}

node .\scripts\generate-class-feature-panel-report-v5-112D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D2.1 raporu üretilemedi."
}

Write-Host "v5.112D2.1 Class Feature Panel tamamen başarılı." -ForegroundColor Green
