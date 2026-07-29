$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2B3 Third Four-Class Player Readiness starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/4] Paladin, Ranger, Sorcerer and Warlock readiness certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/thirdFourClassPlayerReadiness-v6.2B3.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "v6.2B3 RED - third four-class readiness has blockers." -ForegroundColor Red
  Write-Host "Read reports\THIRD_FOUR_CLASS_PLAYER_READINESS_v6.2B3.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/4] Existing class certification suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/paladinBuilderCertification.test.ts `
  src/core/rulesets/rangerBuilderCertification.test.ts `
  src/core/rulesets/sorcererBuilderCertification.test.ts `
  src/core/rulesets/warlockBuilderCertification.test.ts `
  src/core/rulesets/halfCasterOfficialProgression.test.ts `
  src/core/rulesets/warlockWizardOfficialProgression.test.ts
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
Write-Host "  reports\THIRD_FOUR_CLASS_PLAYER_READINESS_v6.2B3.json"
Write-Host "  reports\THIRD_FOUR_CLASS_PLAYER_READINESS_v6.2B3.md"
Write-Host ""
Write-Host "v6.2B3 GREEN - Paladin, Ranger, Sorcerer and Warlock player readiness passed." -ForegroundColor Green
