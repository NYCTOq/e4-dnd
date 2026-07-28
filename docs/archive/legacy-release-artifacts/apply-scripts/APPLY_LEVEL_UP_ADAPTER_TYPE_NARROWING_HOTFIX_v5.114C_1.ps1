$ErrorActionPreference = "Stop"

Write-Host "v5.114C.1 Level-Up Adapter Type Narrowing Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-adapter-type-narrowing-hotfix-v5-114C-1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114C.1 patch script başarısız oldu."
}

npm.cmd run certify:level-up:integration
if ($LASTEXITCODE -ne 0) {
    throw "v5.114C.1 integration sertifikasyonu başarısız oldu."
}

Write-Host "v5.114C.1 Level-Up Character Adapter tamamen başarılı." -ForegroundColor Green
