$ErrorActionPreference = "Stop"

Write-Host "v5.113D1 Spell UI Integration Discovery Contract Gate uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spell-ui-contract-v5-113D1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D1 kurulum başarısız oldu."
}

npm.cmd run certify:spell-runtime:ui:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D1 UI contract gate başarısız oldu."
}

Write-Host "v5.113D1 Spell UI integration contract hazır." -ForegroundColor Green
