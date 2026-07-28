$ErrorActionPreference = "Stop"

Write-Host "v5.113B Spell Runtime Combat Differential Matrix Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spell-runtime-combat-matrix-v5-113B.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113B kurulum başarısız oldu."
}

npm.cmd run certify:spell-runtime:runtime
if ($LASTEXITCODE -ne 0) {
    throw "v5.113B runtime sertifikasyonu başarısız oldu."
}

Write-Host "v5.113B Spell Runtime Combat matrix başarılı." -ForegroundColor Green
