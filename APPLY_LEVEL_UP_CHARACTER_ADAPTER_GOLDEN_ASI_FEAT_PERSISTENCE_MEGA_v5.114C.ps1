$ErrorActionPreference = "Stop"

Write-Host "v5.114C Level-Up Character Adapter Golden ASI Feat Persistence Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-character-adapter-v5-114C.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114C kurulum başarısız oldu."
}

npm.cmd run certify:level-up:integration
if ($LASTEXITCODE -ne 0) {
    throw "v5.114C integration sertifikasyonu başarısız oldu."
}

Write-Host "v5.114C Level-Up Character Adapter tamamen başarılı." -ForegroundColor Green
