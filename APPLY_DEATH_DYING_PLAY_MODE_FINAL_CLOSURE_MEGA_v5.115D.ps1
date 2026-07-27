$ErrorActionPreference = "Stop"
Write-Host "v5.115D Death & Dying Play Mode Final Closure uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-death-dying-final-v5-115D.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.115D kurulum başarısız." }
npm.cmd install --package-lock-only --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw "package-lock güncellenemedi." }
npm.cmd run certify:death-dying:final
if ($LASTEXITCODE -ne 0) { throw "v5.115D final closure başarısız." }
Write-Host "v5.115D Death & Dying domain tamamen kapandı: GREEN." -ForegroundColor Green
