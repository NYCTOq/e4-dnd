$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C3 Player Lifecycle Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/6] 168-scenario player lifecycle matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/playerLifecycleMatrix-v6.2C3.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C3 RED - player lifecycle matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\PLAYER_LIFECYCLE_MATRIX_v6.2C3.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/6] Character creation and level-up suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/fullCharacterCreationJourney.test.ts `
  src/core/rulesets/levelOneToTwentyJourney.test.ts `
  src/core/rulesets/levelUpChoiceCompletion.test.ts `
  src/core/rulesets/levelUpAdvancementReadiness.test.ts `
  src/certification/integration/levelUpPersistenceBridge.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Character creation or level-up certification failed."
}

Write-Host ""
Write-Host "[3/6] Play Mode and class-feature persistence suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playerJourneyConsistency.test.ts `
  src/core/character/playReadiness.test.ts `
  src/certification/integration/classFeaturePersistenceBridge.test.ts `
  src/certification/matrix/classFeatureUsagePersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Play Mode or class-feature persistence certification failed."
}

Write-Host ""
Write-Host "[4/6] Rest and storage persistence suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/rest/restAutomation.test.ts `
  src/features/rest/restSheetPlayIntegration.test.ts `
  src/certification/integration/restRecoveryPersistenceBridge.test.ts `
  src/certification/matrix/restRecoveryPersistenceMatrix.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Rest or storage persistence certification failed."
}

Write-Host ""
Write-Host "[5/6] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[6/6] Production build" -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Production build failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\PLAYER_LIFECYCLE_MATRIX_v6.2C3.json"
Write-Host "  reports\PLAYER_LIFECYCLE_MATRIX_v6.2C3.md"
Write-Host ""
Write-Host "v6.2C3 GREEN - All 168 player lifecycle scenarios passed." -ForegroundColor Green
