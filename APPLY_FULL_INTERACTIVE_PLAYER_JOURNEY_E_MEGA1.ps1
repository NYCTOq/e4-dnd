$ErrorActionPreference = "Stop"
Write-Host "E4 D&D E-MEGA1 Full Interactive Player Journey starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Mega journey source and contract manifest" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "E-MEGA1 RED - mega journey manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\FULL_INTERACTIVE_PLAYER_JOURNEY_E_MEGA1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/10] Character creation, choice and lifecycle" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/allClassCharacterCreationMatrix-v6.2C1.test.ts `
  src/certification/player-readiness/playerChoiceIntegrityMatrix-v6.2C2.test.ts `
  src/certification/player-readiness/playerLifecycleMatrix-v6.2C3.test.ts `
  src/core/character/characterLifecycle.integration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Character creation or lifecycle certification failed."
}

Write-Host ""
Write-Host "[3/10] Sheet, Play Mode and feature actionability" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playReadiness.test.ts `
  src/core/rulesets/characterSheetCertification.test.ts `
  src/certification/integration/characterHubActionabilityContract.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Sheet, Play Mode or actionability certification failed."
}

Write-Host ""
Write-Host "[4/10] Combat, spellcasting, rest and death" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/combatSurvivalEquipmentMatrix-v6.2C4.test.ts `
  src/certification/player-readiness/spellcastingRuntimeMatrix-v6.2C5.test.ts `
  src/features/rest/restAutomation.test.ts `
  src/features/rest/restSheetPlayIntegration.test.ts `
  src/certification/integration/deathDyingPlayModeIntegration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Combat, spellcasting, rest or death certification failed."
}

Write-Host ""
Write-Host "[5/10] Level-up, multiclass and persistence" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/multiclassRuntimeMatrix-v6.2C8.test.ts `
  src/certification/oracle/levelUpProgressionOracle.test.ts `
  src/certification/differential/levelUpProgressionDifferential.test.ts `
  src/certification/integration/levelUpPersistenceBridge.test.ts `
  src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Level-up, multiclass or persistence certification failed."
}

Write-Host ""
Write-Host "[6/10] Backup, export/import, transfer and reload" -ForegroundColor Yellow
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
Write-Host "[7/10] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Clean production build failed."
}

Write-Host ""
Write-Host "[8/10] Desktop and mobile Playwright journey" -ForegroundColor Yellow
npx.cmd playwright test e2e/full-interactive-player-journey-E-MEGA1.spec.ts
if ($LASTEXITCODE -ne 0) {
  throw "Desktop/mobile browser journey failed."
}

Write-Host ""
Write-Host "[9/10] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[10/10] Final release and distribution regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/fullPlayerSessionE2EClosure-v6.2D7.test.ts `
  src/certification/player-readiness/releaseCandidateCertification-v6.2D8.test.ts `
  src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts `
  src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Final release regression failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\FULL_INTERACTIVE_PLAYER_JOURNEY_E_MEGA1.json"
Write-Host "  reports\FULL_INTERACTIVE_PLAYER_JOURNEY_E_MEGA1.md"
Write-Host ""
Write-Host "E-MEGA1 GREEN - Full interactive player journey passed on desktop, mobile, reload and release regression." -ForegroundColor Green
