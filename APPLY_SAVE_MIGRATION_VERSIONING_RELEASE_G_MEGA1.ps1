$ErrorActionPreference = "Stop"
Write-Host "E4 D&D G-MEGA1 Save Migration, Versioning and Release Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/11] Migration and release manifest" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "G-MEGA1 RED - migration manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\SAVE_MIGRATION_VERSIONING_RELEASE_G_MEGA1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/11] Character hydration and integrity" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/storage/characterHydration.test.ts `
  src/core/character/characterIntegrity.test.ts `
  src/core/character/characterLifecycle.integration.test.ts `
  src/core/character/playerJourneyConsistency.test.ts
if ($LASTEXITCODE -ne 0) { throw "Character hydration or integrity failed." }

Write-Host ""
Write-Host "[3/11] Pre-migration backup and recovery" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts
if ($LASTEXITCODE -ne 0) { throw "Pre-migration backup or recovery failed." }

Write-Host ""
Write-Host "[4/11] Cross-version persistence matrices" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/matrix/classSubclassPersistenceMatrix.test.ts `
  src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts `
  src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts `
  src/certification/matrix/deathDyingCharacterPersistenceMatrix.test.ts `
  src/certification/matrix/restRecoveryPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) { throw "Cross-version persistence failed." }

Write-Host ""
Write-Host "[5/11] Release versioning and packaging gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts `
  src/core/release/releasePackaging-v5.144.test.ts `
  src/core/release/postReleaseQa.test.ts
if ($LASTEXITCODE -ne 0) { throw "Release versioning or packaging failed." }

Write-Host ""
Write-Host "[6/11] PWA update, offline and cache regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts `
  src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts `
  src/core/performance/bundlePerformanceBudget-v5.142.test.ts `
  src/core/rulesets/rulesetLoaderChunks.test.ts
if ($LASTEXITCODE -ne 0) { throw "PWA update or cache regression failed." }

Write-Host ""
Write-Host "[7/11] Rollback and recovery safety" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/backupRecovery.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) { throw "Rollback or recovery safety failed." }

Write-Host ""
Write-Host "[8/11] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

if (-not (Test-Path ".\dist\index.html")) {
  throw "dist\index.html missing after build."
}

Write-Host ""
Write-Host "[9/11] Browser migration and release smoke" -ForegroundColor Yellow
npx.cmd playwright test e2e/save-migration-release-G-MEGA1.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Browser migration smoke failed." }

Write-Host ""
Write-Host "[10/11] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[11/11] Mega regression and final release gate" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts `
  src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts `
  src/certification/player-readiness/contentAccuracyRulesetDifferential-F-MEGA1.test.ts `
  src/certification/player-readiness/contentExpansionCatalogClosure-F-MEGA2.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Mega regression failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\SAVE_MIGRATION_VERSIONING_RELEASE_G_MEGA1.json"
Write-Host "  reports\SAVE_MIGRATION_VERSIONING_RELEASE_G_MEGA1.md"
Write-Host "  release\RELEASE_MANIFEST_G_MEGA1.json"
Write-Host "  release\CHANGELOG_G_MEGA1.md"
Write-Host "  release\ROLLBACK_PLAN_G_MEGA1.md"
Write-Host ""
Write-Host "G-MEGA1 GREEN - Save migration, backup, rollback, PWA update and release closure passed." -ForegroundColor Green
