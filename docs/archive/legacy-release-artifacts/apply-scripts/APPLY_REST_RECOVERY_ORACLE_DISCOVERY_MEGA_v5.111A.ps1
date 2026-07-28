$ErrorActionPreference = "Stop"

Write-Host "v5.111A Rest, Recovery & Resource Oracle + Discovery Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-recovery-oracle-discovery-v5-111A.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.111A kurulum scripti başarısız oldu."
}

npm.cmd run certify:rest-recovery:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.111A foundation sertifikasyonu başarısız oldu."
}

Write-Host "v5.111A foundation başarılı." -ForegroundColor Green
Write-Host "Runtime discovery raporunu certification-reports klasöründe bulabilirsin." -ForegroundColor Green
