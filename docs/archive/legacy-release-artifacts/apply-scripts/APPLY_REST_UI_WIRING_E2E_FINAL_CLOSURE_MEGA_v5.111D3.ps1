$ErrorActionPreference = "Stop"

Write-Host "v5.111D3 Rest UI Wiring E2E Final Closure Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-ui-wiring-v5-111D3.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D3 kurulum ve wiring başarısız oldu."
}

npm.cmd run certify:rest-ui:closure
if ($LASTEXITCODE -ne 0) {
    throw "v5.111D3 final closure sertifikasyonu başarısız oldu."
}

Write-Host "v5.111D3 Rest Recovery Resource domain tamamen kapandı." -ForegroundColor Green
