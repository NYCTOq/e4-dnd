$ErrorActionPreference = "Stop"

Write-Host "v5.114A.1 Level-Up Multiclass Record Type Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-multiclass-record-type-hotfix-v5-114A-1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114A.1 patch script başarısız oldu."
}

npm.cmd run certify:level-up:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.114A.1 foundation sertifikasyonu başarısız oldu."
}

Write-Host "v5.114A.1 Level-Up Progression foundation tamamen başarılı." -ForegroundColor Green
