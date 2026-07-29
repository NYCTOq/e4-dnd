$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D7 Full Player Session E2E Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/9] 144 complete player-session scenarios" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/fullPlayerSessionE2EClosure-v6.2D7.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D7 RED - player session matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\FULL_PLAYER_SESSION_E2E_CLOSURE_v6.2D7.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/9] Character creation and lifecycle suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/allClassCharacterCreationMatrix-v6.2C1.test.ts `
  src/certification/player-readiness/playerChoiceIntegrityMatrix-v6.2C2.test.ts `
  src/certification/player-readiness/playerLifecycleMatrix-v6.2C3.test.ts `
  src/core/character/characterLifecycle.integration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Character creation or lifecycle certification failed."
}

Write-Host ""
Write-Host "[3/9] Sheet, Play Mode and runtime closure suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playReadiness.test.ts `
  src/core/rulesets/characterSheetCertification.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Sheet or Play Mode certification failed."
}

Write-Host ""
Write-Host "[4/9] Combat, equipment and survival suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/combatSurvivalEquipmentMatrix-v6.2C4.test.ts `
  src/certification/matrix/equipmentCombatScenarioMatrix.test.ts `
  src/certification/differential/equipmentCombatDifferential.test.ts `
  src/core/character/survivalRules.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Combat, equipment or survival certification failed."
}

Write-Host ""
Write-Host "[5/9] Rest, death and recovery suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/matrix/restRecoveryScenarioMatrix.test.ts `
  src/certification/differential/restRecoveryDifferential.test.ts `
  src/certification/matrix/deathDyingScenarioMatrix.test.ts `
  src/certification/integration/deathDyingPlayModeIntegration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Rest, death or recovery certification failed."
}

Write-Host ""
Write-Host "[6/9] Level-up and persistence suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/oracle/levelUpProgressionOracle.test.ts `
  src/certification/differential/levelUpProgressionDifferential.test.ts `
  src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts `
  src/certification/integration/levelUpPersistenceBridge.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Level-up or persistence certification failed."
}

Write-Host ""
Write-Host "[7/9] Backup, transfer and reload suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Backup, transfer or reload certification failed."
}

Write-Host ""
Write-Host "[8/9] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[9/9] Production build" -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Production build failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\FULL_PLAYER_SESSION_E2E_CLOSURE_v6.2D7.json"
Write-Host "  reports\FULL_PLAYER_SESSION_E2E_CLOSURE_v6.2D7.md"
Write-Host ""
Write-Host "v6.2D7 GREEN - Full player session lifecycle passed from creation through reload." -ForegroundColor Green
