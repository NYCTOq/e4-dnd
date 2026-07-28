$ErrorActionPreference = "Stop"

Write-Host "v5.113C Spell Character Adapter Golden Combat Persistence Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-spell-character-adapter-v5-113C.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.113C kurulum başarısız oldu."
}

npm.cmd run certify:spell-runtime:integration
if ($LASTEXITCODE -ne 0) {
    throw "v5.113C integration sertifikasyonu başarısız oldu."
}

Write-Host "v5.113C Spell Character Adapter ve combat persistence başarılı." -ForegroundColor Green
