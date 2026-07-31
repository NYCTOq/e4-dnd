$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Payload = Join-Path $Root 'payload'

if (-not (Test-Path (Join-Path $Root 'package.json'))) {
  throw 'Bu ZIP proje kokune cikarilmali. package.json bulunamadi.'
}

Copy-Item (Join-Path $Payload '*') $Root -Recurse -Force

# Ilk paketten kalan patch klasoru Vitest tarafindan ikinci kaynak agaci gibi kesfediliyordu.
$OldPatch = Join-Path $Root 'patch'
if (Test-Path $OldPatch) {
  Remove-Item $OldPatch -Recurse -Force
}

# Hotfix payload'u da test/build oncesinde temizle.
if (Test-Path $Payload) {
  Remove-Item $Payload -Recurse -Force
}

Write-Host 'N-MEGA1 Hotfix 1 uygulandi. Audit, test ve build yeniden calistiriliyor...' -ForegroundColor Cyan
npm.cmd run certify:n-mega1
Write-Host 'N-MEGA1 Hotfix 1 komutu tamamlandi.' -ForegroundColor Green
