$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2B2 Second Four-Class Player Readiness starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/4] Barbarian, Bard, Druid and Monk readiness certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/secondFourClassPlayerReadiness-v6.2B2.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "v6.2B2 RED - second four-class readiness has blockers." -ForegroundColor Red
  Write-Host "Read reports\SECOND_FOUR_CLASS_PLAYER_READINESS_v6.2B2.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/4] Existing class certification suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/barbarianBuilderCertification.test.ts `
  src/core/rulesets/bardBuilderCertification.test.ts `
  src/core/rulesets/druidBuilderCertification.test.ts `
  src/core/rulesets/monkBuilderCertification.test.ts
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
Write-Host "  reports\SECOND_FOUR_CLASS_PLAYER_READINESS_v6.2B2.json"
Write-Host "  reports\SECOND_FOUR_CLASS_PLAYER_READINESS_v6.2B2.md"
Write-Host ""
Write-Host "v6.2B2 GREEN - Barbarian, Bard, Druid and Monk player readiness passed." -ForegroundColor Green
