$ErrorActionPreference = "Stop"

Write-Host "v5.112A Class Subclass Runtime Oracle Discovery Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-class-subclass-runtime-oracle-discovery-v5-112A.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112A kurulum scripti başarısız oldu."
}

npm.cmd run certify:class-subclass:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.112A foundation sertifikasyonu başarısız oldu."
}

Write-Host "v5.112A Class/Subclass runtime foundation başarılı." -ForegroundColor Green
Write-Host "Discovery raporları certification-reports klasöründe." -ForegroundColor Green
