$ErrorActionPreference = "Stop"

Write-Host "v5.115A Death Dying Oracle Discovery Foundation Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-death-dying-foundation-v5-115A.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.115A kurulum başarısız oldu."
}

npm.cmd run certify:death-dying:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.115A foundation sertifikasyonu başarısız oldu."
}

Write-Host "v5.115A Death Dying foundation tamamen başarılı." -ForegroundColor Green
