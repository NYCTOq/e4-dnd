$ErrorActionPreference = "Stop"

Write-Host "v5.112B Class Subclass Runtime Differential Matrix Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-class-subclass-runtime-matrix-v5-112B.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112B kurulum başarısız oldu."
}

npm.cmd run certify:class-subclass:runtime
if ($LASTEXITCODE -ne 0) {
    throw "v5.112B runtime sertifikasyonu başarısız oldu."
}

Write-Host "v5.112B Class/Subclass runtime matrix başarılı." -ForegroundColor Green
