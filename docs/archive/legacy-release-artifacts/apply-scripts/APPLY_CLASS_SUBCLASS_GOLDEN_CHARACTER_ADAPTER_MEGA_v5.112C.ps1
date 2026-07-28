$ErrorActionPreference = "Stop"

Write-Host "v5.112C Class Subclass Golden Character Adapter Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-class-subclass-golden-adapter-v5-112C.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.112C kurulum başarısız oldu."
}

npm.cmd run certify:class-subclass:integration
if ($LASTEXITCODE -ne 0) {
    throw "v5.112C integration sertifikasyonu başarısız oldu."
}

Write-Host "v5.112C Class/Subclass golden adapter başarılı." -ForegroundColor Green
