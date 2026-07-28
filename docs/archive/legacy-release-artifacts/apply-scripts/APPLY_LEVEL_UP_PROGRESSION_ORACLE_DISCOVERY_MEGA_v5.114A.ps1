$ErrorActionPreference = "Stop"

Write-Host "v5.114A Level-Up Progression Oracle Discovery Mega uygulanıyor..." -ForegroundColor Cyan

node .\scripts\apply-level-up-progression-oracle-discovery-v5-114A.mjs
if ($LASTEXITCODE -ne 0) {
    throw "v5.114A kurulum başarısız oldu."
}

npm.cmd run certify:level-up:foundation
if ($LASTEXITCODE -ne 0) {
    throw "v5.114A foundation sertifikasyonu başarısız oldu."
}

Write-Host "v5.114A Level-Up Progression foundation başarılı." -ForegroundColor Green
