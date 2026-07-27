$ErrorActionPreference = "Stop"
Write-Host "v5.115C Death & Dying Character Integration uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-death-dying-character-v5-115C.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.115C kurulum başarısız." }
npm.cmd install --package-lock-only --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw "package-lock güncellenemedi." }
npm.cmd run certify:death-dying:character
if ($LASTEXITCODE -ne 0) { throw "v5.115C sertifikasyonu başarısız." }
Write-Host "v5.115C Death & Dying Character Integration tamamen GREEN." -ForegroundColor Green
