$ErrorActionPreference = "Stop"

Write-Host "v5.114D1 Level-Up UI Contract Discovery Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-ui-contract-v5-114D1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D1 kurulum başarısız oldu."
}

npm.cmd run certify:level-up:ui:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D1 UI contract gate başarısız oldu."
}

Write-Host "v5.114D1 Level-Up UI integration contract hazır." -ForegroundColor Green
