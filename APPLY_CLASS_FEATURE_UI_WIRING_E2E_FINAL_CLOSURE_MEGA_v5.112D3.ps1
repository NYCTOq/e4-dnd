$ErrorActionPreference = "Stop"

Write-Host "v5.112D3 Class Feature UI Wiring E2E Final Closure Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-class-feature-ui-wiring-v5-112D3.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D3 kurulum ve wiring başarısız oldu."
}

npm.cmd run certify:class-subclass:closure
if ($LASTEXITCODE -ne 0) {
    throw "v5.112D3 final closure sertifikasyonu başarısız oldu."
}

Write-Host "v5.112D3 Class/Subclass Runtime UI domain tamamen kapandı." -ForegroundColor Green
