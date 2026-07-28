$ErrorActionPreference = "Stop"

Write-Host "v5.112D1 Class Subclass UI Discovery Contract Gate uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-class-subclass-ui-contract-v5-112D1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D1 kurulum başarısız oldu."
}

npm.cmd run certify:class-subclass:ui:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D1 UI contract gate başarısız oldu."
}

Write-Host "v5.112D1 Class/Subclass UI integration contract hazır." -ForegroundColor Green
