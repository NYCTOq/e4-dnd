$ErrorActionPreference = "Stop"

Write-Host "v5.113D3 Spell UI Wiring E2E Final Closure Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spell-ui-wiring-v5-113D3.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D3 wiring kurulumu başarısız oldu."
}

npm.cmd run certify:spell-runtime:closure
if ($LASTEXITCODE -ne 0) {
    throw "v5.113D3 final closure sertifikasyonu başarısız oldu."
}

Write-Host "v5.113D3 Spell Runtime Combat UI domain tamamen kapandı." -ForegroundColor Green
