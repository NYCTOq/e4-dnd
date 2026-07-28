$ErrorActionPreference = "Stop"

Write-Host "v5.113C.1 Spell Concentration Matrix Type Hotfix uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spell-concentration-matrix-type-hotfix-v5-113C-1.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113C.1 patch script başarısız oldu."
}

npm.cmd run certify:spell-runtime:integration
if ($LASTEXITCODE -ne 0) {
    throw "v5.113C.1 integration sertifikasyonu başarısız oldu."
}

Write-Host "v5.113C.1 Spell Character Adapter tamamen başarılı." -ForegroundColor Green
