$ErrorActionPreference = "Stop"
Write-Host "E4 D&D H-MEGA1 Production Operations and Diagnostics Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
New-Item -ItemType Directory -Path ".\release" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Operations manifest certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "H-MEGA1 RED - operations manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\PRODUCTION_OPERATIONS_DIAGNOSTICS_H_MEGA1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/10] Golden release and mega regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts `
  src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts `
  src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts `
  src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts `
  src/certification/player-readiness/contentExpansionCatalogClosure-F-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Golden release or mega regression failed." }

Write-Host ""
Write-Host "[3/10] Post-release and release-hardening gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/postReleaseQa.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) { throw "Post-release or release-hardening gate failed." }

Write-Host ""
Write-Host "[4/10] Storage health, hydration and recovery" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/storage/characterHydration.test.ts `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts `
  src/core/character/characterIntegrity.test.ts
if ($LASTEXITCODE -ne 0) { throw "Storage health or recovery failed." }

Write-Host ""
Write-Host "[5/10] Performance, chunks and accessibility" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/performance/bundlePerformanceBudget-v5.142.test.ts `
  src/core/rulesets/rulesetLoaderChunks.test.ts `
  src/core/qa/mobileAccessibilityPerformance.test.ts `
  src/core/quality/uiMobileAccessibilityPolish.test.ts
if ($LASTEXITCODE -ne 0) { throw "Performance or accessibility gate failed." }

Write-Host ""
Write-Host "[6/10] Offline, PWA and rollback recovery" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts `
  src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/features/backup/backupRecovery.test.ts
if ($LASTEXITCODE -ne 0) { throw "Offline, PWA or rollback recovery failed." }

Write-Host ""
Write-Host "[7/10] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[8/10] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Clean production build failed." }

if (-not (Test-Path ".\dist\index.html")) { throw "dist\index.html missing." }
if (-not (Test-Path ".\dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing." }
if (-not (Test-Path ".\dist\sw.js")) { throw "dist\sw.js missing." }

Write-Host ""
Write-Host "[9/10] Desktop and mobile operations smoke" -ForegroundColor Yellow
npx.cmd playwright test e2e/production-operations-H-MEGA1.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Operations browser smoke failed." }

Write-Host ""
Write-Host "[10/10] Generate production health snapshot and final gate" -ForegroundColor Yellow
node ".\scripts\generate-production-health-snapshot-H-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Production health snapshot generation failed." }

if (-not (Test-Path ".\release\PRODUCTION_HEALTH_SNAPSHOT_H_MEGA1.json")) {
  throw "Production health snapshot missing."
}

npx.cmd vitest run `
  src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/postReleaseQa.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final operations regression failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\PRODUCTION_OPERATIONS_DIAGNOSTICS_H_MEGA1.json"
Write-Host "  reports\PRODUCTION_OPERATIONS_DIAGNOSTICS_H_MEGA1.md"
Write-Host "  release\PRODUCTION_HEALTH_SNAPSHOT_H_MEGA1.json"
Write-Host "  release\PRODUCTION_OPERATIONS_CHECKLIST_H_MEGA1.md"
Write-Host ""
Write-Host "H-MEGA1 GREEN - Production operations, diagnostics, recovery, performance and post-release gates passed." -ForegroundColor Green
