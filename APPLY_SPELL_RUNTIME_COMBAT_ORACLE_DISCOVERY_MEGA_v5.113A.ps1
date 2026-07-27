$ErrorActionPreference = "Stop"

Write-Host "v5.113A Spell Runtime Combat Oracle Discovery Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spell-runtime-combat-oracle-discovery-v5-113A.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113A kurulum başarısız oldu."
}

npm.cmd run certify:spell-runtime:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.113A foundation sertifikasyonu başarısız oldu."
}

Write-Host "v5.113A Spell Runtime Combat foundation başarılı." -ForegroundColor Green
