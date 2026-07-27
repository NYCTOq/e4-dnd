$ErrorActionPreference = "Stop"

Write-Host "v5.115B Death Dying Canonical Runtime Differential Matrix Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-death-dying-runtime-v5-115B.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.115B kurulum başarısız oldu."
}

npm.cmd run certify:death-dying:runtime
if ($LASTEXITCODE -ne 0) {
    throw "v5.115B runtime sertifikasyonu başarısız oldu."
}

Write-Host "v5.115B Death Dying canonical runtime tamamen başarılı." -ForegroundColor Green
