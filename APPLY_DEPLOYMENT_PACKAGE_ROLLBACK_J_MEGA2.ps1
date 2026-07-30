$ErrorActionPreference = "Stop"
Write-Host "E4 D&D J-MEGA2 Deployment Package and Rollback Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\release" -Force | Out-Null
New-Item -ItemType Directory -Path ".\deployment" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Deployment artifact certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/deploymentPackageRollback-J-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Deployment artifact certification failed." }

Write-Host ""
Write-Host "[2/10] Release candidate and acceptance regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/versionBumpReleaseCandidate-J-MEGA1.test.ts `
  src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts `
  src/certification/player-readiness/realUiInteractionClosure-I-MEGA2.test.ts `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Release candidate or acceptance regression failed." }

Write-Host ""
Write-Host "[3/10] Migration, operations and rollback regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts `
  src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts `
  src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts `
  src/features/backup/backupRecovery.test.ts
if ($LASTEXITCODE -ne 0) { throw "Migration, operations or rollback regression failed." }

Write-Host ""
Write-Host "[4/10] PWA, offline and distribution regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts `
  src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts `
  src/core/release/releasePackaging-v5.144.test.ts
if ($LASTEXITCODE -ne 0) { throw "PWA or distribution regression failed." }

Write-Host ""
Write-Host "[5/10] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[6/10] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

if (-not (Test-Path ".\dist\index.html")) { throw "dist\index.html missing." }
if (-not (Test-Path ".\dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing." }
if (-not (Test-Path ".\dist\sw.js")) { throw "dist\sw.js missing." }

Write-Host ""
Write-Host "[7/10] Generate clean deployment folder and checksums" -ForegroundColor Yellow
node ".\scripts\generate-deployment-package-J-MEGA2.mjs"
if ($LASTEXITCODE -ne 0) { throw "Deployment package generation failed." }

Write-Host ""
Write-Host "[8/10] Verify deployment package byte-for-byte" -ForegroundColor Yellow
node ".\scripts\verify-deployment-package-J-MEGA2.mjs"
if ($LASTEXITCODE -ne 0) { throw "Deployment package verification failed." }

Write-Host ""
Write-Host "[9/10] Final browser acceptance and PWA smoke" -ForegroundColor Yellow
npx.cmd playwright test `
  e2e/final-user-acceptance-I-MEGA1.spec.ts `
  e2e/real-ui-interaction-I-MEGA2.spec.ts `
  e2e/production-golden-release-G-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Final browser deployment smoke failed." }

Write-Host ""
Write-Host "[10/10] Final deployment and release gate" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/deploymentPackageRollback-J-MEGA2.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final deployment release gate failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  deployment\e4-dnd-6.2.0-rc1\"
Write-Host "  release\DEPLOYMENT_MANIFEST_J_MEGA2.json"
Write-Host "  release\DEPLOYMENT_CHECKLIST_J_MEGA2.md"
Write-Host "  release\LIVE_SMOKE_RUNBOOK_J_MEGA2.md"
Write-Host "  release\CACHE_UPDATE_STRATEGY_J_MEGA2.md"
Write-Host "  release\ROLLBACK_BUNDLE_CHECKLIST_J_MEGA2.md"
Write-Host ""
Write-Host "J-MEGA2 GREEN - Deployment folder, checksums, rollback bundle, PWA smoke and final release gates passed." -ForegroundColor Green
