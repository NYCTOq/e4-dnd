$ErrorActionPreference = "Stop"

Write-Host "v5.114D3 Level-Up UI Wiring E2E Final Closure Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-ui-wiring-v5-114D3.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D3 wiring kurulumu başarısız oldu."
}

npm.cmd run certify:level-up:closure
if ($LASTEXITCODE -ne 0) {
    throw "v5.114D3 final closure sertifikasyonu başarısız oldu."
}

Write-Host "v5.114D3 Level-Up Progression UI domain tamamen kapandı." -ForegroundColor Green
