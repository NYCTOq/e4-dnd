$ErrorActionPreference = "Stop"

Write-Host "v5.114B Level-Up Canonical Runtime Differential Matrix Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-runtime-v5-114B.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114B kurulum başarısız oldu."
}

npm.cmd run certify:level-up:runtime
if ($LASTEXITCODE -ne 0) {
    throw "v5.114B runtime sertifikasyonu başarısız oldu."
}

Write-Host "v5.114B Level-Up canonical runtime tamamen başarılı." -ForegroundColor Green
