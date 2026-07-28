$ErrorActionPreference = "Stop"

Write-Host "v5.113D2.2 Spell Casting Mutation Regex Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spell-casting-mutation-regex-hotfix-v5-113D2-2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D2.2 patch script başarısız oldu."
}

npm.cmd run certify:spell-runtime:ui:component-foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D2.2 component foundation başarısız oldu."
}

node .\scripts\generate-spell-casting-panel-report-v5-113D2.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D2.2 raporu üretilemedi."
}

Write-Host "v5.113D2.2 Spell Casting Panel tamamen başarılı." -ForegroundColor Green
