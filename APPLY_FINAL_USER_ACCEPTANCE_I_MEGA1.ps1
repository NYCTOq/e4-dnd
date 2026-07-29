$ErrorActionPreference = "Stop"
Write-Host "E4 D&D I-MEGA1 Final User Acceptance and Device Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
New-Item -ItemType Directory -Path ".\release" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Final user acceptance manifest" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "I-MEGA1 RED - user acceptance manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\FINAL_USER_ACCEPTANCE_I_MEGA1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/10] Full player journey regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts `
  src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts `
  src/certification/player-readiness/contentExpansionCatalogClosure-F-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Player journey regression failed." }

Write-Host ""
Write-Host "[3/10] Accessibility, mobile and UI closure" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/qa/mobileAccessibilityPerformance.test.ts `
  src/core/quality/uiMobileAccessibilityPolish.test.ts `
  src/certification/integration/navigationSearchUiFinalClosureContract.test.ts `
  src/certification/integration/characterHubUiFinalClosureContract.test.ts `
  src/certification/integration/crossDomainUiFinalClosureContract.test.ts
if ($LASTEXITCODE -ne 0) { throw "Accessibility or UI closure failed." }

Write-Host ""
Write-Host "[4/10] Navigation, search and route parity" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/search/globalSearch.test.ts `
  src/certification/discovery/navigationSearchDiscovery.test.ts `
  src/certification/differential/navigationSearchRouteParity.test.ts `
  src/certification/integration/navigationSearchGoldenIntentContract.test.ts
if ($LASTEXITCODE -ne 0) { throw "Navigation or search regression failed." }

Write-Host ""
Write-Host "[5/10] Builder, sheet and Play Mode consistency" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playReadiness.test.ts `
  src/core/rulesets/fullCharacterCertification.integration.test.ts `
  src/certification/integration/characterHubActionabilityContract.test.ts
if ($LASTEXITCODE -ne 0) { throw "Builder, sheet or Play Mode regression failed." }

Write-Host ""
Write-Host "[6/10] Persistence and recovery" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/storage/characterHydration.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/characters/characterTransfer.test.ts
if ($LASTEXITCODE -ne 0) { throw "Persistence or recovery regression failed." }

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
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

if (-not (Test-Path ".\dist\index.html")) { throw "dist\index.html missing." }
if (-not (Test-Path ".\dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing." }
if (-not (Test-Path ".\dist\sw.js")) { throw "dist\sw.js missing." }

Write-Host ""
Write-Host "[9/10] Desktop, tablet and mobile Playwright acceptance" -ForegroundColor Yellow
npx.cmd playwright test e2e/final-user-acceptance-I-MEGA1.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Browser acceptance matrix failed." }

Write-Host ""
Write-Host "[10/10] Acceptance snapshot and final release gate" -ForegroundColor Yellow
node ".\scripts\generate-user-acceptance-snapshot-I-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Acceptance snapshot generation failed." }

npx.cmd vitest run `
  src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts `
  src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts `
  src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final user acceptance regression failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\FINAL_USER_ACCEPTANCE_I_MEGA1.json"
Write-Host "  reports\FINAL_USER_ACCEPTANCE_I_MEGA1.md"
Write-Host "  release\FINAL_USER_ACCEPTANCE_SNAPSHOT_I_MEGA1.json"
Write-Host "  release\FINAL_USER_ACCEPTANCE_CHECKLIST_I_MEGA1.md"
Write-Host ""
Write-Host "I-MEGA1 GREEN - Desktop, tablet, mobile, keyboard, persistence, PWA and final user acceptance passed." -ForegroundColor Green
