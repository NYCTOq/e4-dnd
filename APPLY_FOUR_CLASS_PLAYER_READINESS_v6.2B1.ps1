$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2B1 Four-Class Player Readiness starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/4] Cleric, Fighter, Rogue and Wizard readiness certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/fourClassPlayerReadiness-v6.2B1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "v6.2B1 RED - four-class player readiness has blockers." -ForegroundColor Red
  Write-Host "Read reports\FOUR_CLASS_PLAYER_READINESS_v6.2B1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/4] Existing class certification suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/clericBuilderCertification.test.ts `
  src/core/rulesets/wizardBuilderCertification.test.ts `
  src/core/rulesets/rogueBuilderCertification.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Existing class certification suite failed."
}

Write-Host ""
Write-Host "[3/4] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[4/4] Production build" -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Production build failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\FOUR_CLASS_PLAYER_READINESS_v6.2B1.json"
Write-Host "  reports\FOUR_CLASS_PLAYER_READINESS_v6.2B1.md"
Write-Host ""
Write-Host "v6.2B1 GREEN - Cleric, Fighter, Rogue and Wizard player readiness passed." -ForegroundColor Green
