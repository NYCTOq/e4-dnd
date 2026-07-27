$ErrorActionPreference = "Stop"
Write-Host "v5.113D2 Spell Casting Panel Combat Persistence Bridge Mega uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-spell-casting-panel-v5-113D2.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.113D2 kurulum başarısız oldu." }
npm.cmd run certify:spell-runtime:ui:component-foundation
if ($LASTEXITCODE -ne 0) { throw "v5.113D2 component foundation başarısız oldu." }
node .\scripts\generate-spell-casting-panel-report-v5-113D2.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.113D2 raporu üretilemedi." }
Write-Host "v5.113D2 Spell Casting Panel ve combat persistence bridge başarılı." -ForegroundColor Green
