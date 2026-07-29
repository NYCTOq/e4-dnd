$ErrorActionPreference = "Stop"
Write-Host "E4 D&D H-MEGA2 Support, Recovery and Maintenance Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
New-Item -ItemType Directory -Path ".\release" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Support and recovery manifest" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "H-MEGA2 RED - support/recovery manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\SUPPORT_RECOVERY_MAINTENANCE_H_MEGA2.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/10] Operations and golden release baseline" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Operations or golden release baseline failed." }

Write-Host ""
Write-Host "[3/10] Backup and full recovery drill" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) { throw "Backup or recovery drill failed." }

Write-Host ""
Write-Host "[4/10] Character integrity and persistence" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/character/characterIntegrity.test.ts `
  src/core/character/characterLifecycle.integration.test.ts `
  src/core/character/playerJourneyConsistency.test.ts `
  src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts `
  src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) { throw "Character integrity or persistence failed." }

Write-Host ""
Write-Host "[5/10] Release support, update and offline recovery" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/postReleaseQa.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts `
  src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts `
  src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts `
  src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) { throw "Release support or offline recovery failed." }

Write-Host ""
Write-Host "[6/10] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[7/10] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

if (-not (Test-Path ".\dist\index.html")) { throw "dist\index.html missing." }
if (-not (Test-Path ".\dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing." }
if (-not (Test-Path ".\dist\sw.js")) { throw "dist\sw.js missing." }

Write-Host ""
Write-Host "[8/10] Desktop and mobile support/recovery smoke" -ForegroundColor Yellow
npx.cmd playwright test e2e/support-recovery-maintenance-H-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Support/recovery browser smoke failed." }

Write-Host ""
Write-Host "[9/10] Generate maintenance snapshot" -ForegroundColor Yellow
node ".\scripts\generate-maintenance-snapshot-H-MEGA2.mjs"
if ($LASTEXITCODE -ne 0) { throw "Maintenance snapshot generation failed." }

if (-not (Test-Path ".\release\MAINTENANCE_SNAPSHOT_H_MEGA2.json")) {
  throw "Maintenance snapshot missing."
}

Write-Host ""
Write-Host "[10/10] Final support and release regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts `
  src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final support/release regression failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\SUPPORT_RECOVERY_MAINTENANCE_H_MEGA2.json"
Write-Host "  reports\SUPPORT_RECOVERY_MAINTENANCE_H_MEGA2.md"
Write-Host "  release\MAINTENANCE_SNAPSHOT_H_MEGA2.json"
Write-Host "  release\MAINTENANCE_RUNBOOK_H_MEGA2.md"
Write-Host "  release\USER_RECOVERY_CHECKLIST_H_MEGA2.md"
Write-Host ""
Write-Host "H-MEGA2 GREEN - Support, recovery drill, update safety, maintenance and release regression passed." -ForegroundColor Green
