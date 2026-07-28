$ErrorActionPreference = "Stop"

Write-Host "v5.111C Rest Recovery Golden Character Integration Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-recovery-golden-integration-v5-111C.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111C kurulum başarısız oldu."
}

npm.cmd run certify:rest-recovery:integration
if ($LASTEXITCODE -ne 0) {
    throw "v5.111C integration sertifikasyonu başarısız oldu."
}

Write-Host "v5.111C Golden Character Integration başarılı." -ForegroundColor Green
