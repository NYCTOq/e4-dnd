$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Patch = Join-Path $Root 'patch'
if (-not (Test-Path (Join-Path $Root 'package.json'))) { throw 'Bu ZIP proje kokune cikarilmali. package.json bulunamadi.' }
Copy-Item (Join-Path $Patch '*') $Root -Recurse -Force
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.scripts['audit:player-system:n-mega1']='node scripts/n-mega1-player-system-inventory.mjs';p.scripts['test:n-mega1']='vitest run src/certification/player-readiness/nMega1Inventory.test.ts';p.scripts['certify:n-mega1']='npm run audit:player-system:n-mega1 && npm run test:n-mega1 && npm run build';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');"
Write-Host 'N-MEGA1 dosyalari uygulandi.' -ForegroundColor Cyan
Write-Host 'Envanter ve sertifikasyon calistiriliyor...' -ForegroundColor Cyan
npm.cmd run certify:n-mega1
Write-Host 'N-MEGA1 komutu tamamlandi. Terminal ciktisini ve certification-reports\n-mega1 klasorunu kontrol edin.' -ForegroundColor Green
