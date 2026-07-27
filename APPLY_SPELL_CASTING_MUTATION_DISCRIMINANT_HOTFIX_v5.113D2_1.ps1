$ErrorActionPreference = "Stop"

Write-Host "v5.113D2.1 Spell Casting Mutation Discriminant Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spell-casting-mutation-discriminant-hotfix-v5-113D2-1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D2.1 patch script başarısız oldu."
}

npm.cmd run certify:spell-runtime:ui:component-foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D2.1 component foundation başarısız oldu."
}

node .\scripts\generate-spell-casting-panel-report-v5-113D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D2.1 raporu üretilemedi."
}

Write-Host "v5.113D2.1 Spell Casting Panel tamamen başarılı." -ForegroundColor Green
