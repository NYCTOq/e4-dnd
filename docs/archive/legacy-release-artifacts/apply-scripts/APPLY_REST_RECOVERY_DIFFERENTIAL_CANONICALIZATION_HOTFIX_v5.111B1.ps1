$ErrorActionPreference = "Stop"

Write-Host "v5.111B1 Rest Recovery Differential Canonicalization uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-rest-recovery-differential-canonicalization-v5-111B1.mjs

if ($LASTEXITCODE -ne 0) {
    throw "v5.111B1 patch script başarısız oldu."
}

npm.cmd run certify:rest-recovery:differential

if ($LASTEXITCODE -ne 0) {
    throw "v5.111B1 differential sertifikasyonu başarısız oldu."
}

npm.cmd run certify:rest-recovery:matrix

if ($LASTEXITCODE -ne 0) {
    throw "v5.111B1 scenario matrix başarısız oldu."
}

npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    throw "v5.111B1 production build başarısız oldu."
}

npm.cmd run certify:rest-recovery:runtime:report

if ($LASTEXITCODE -ne 0) {
    throw "v5.111B1 runtime raporu üretilemedi."
}

Write-Host "v5.111B1 Rest Recovery runtime sertifikasyonu başarılı." -ForegroundColor Green
