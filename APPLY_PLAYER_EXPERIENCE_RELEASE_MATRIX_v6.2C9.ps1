$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C9 Player Experience and Release Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/7] Player experience and release artifact matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/playerExperienceReleaseMatrix-v6.2C9.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C9 RED - player experience matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\PLAYER_EXPERIENCE_RELEASE_MATRIX_v6.2C9.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/7] Character Hub and player journey suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/golden/characterHubGoldenIntegration.test.ts `
  src/certification/integration/characterHubGoldenIntegrationContract.test.ts `
  src/certification/integration/characterHubActionabilityContract.test.ts `
  src/certification/integration/characterHubUiFinalClosureContract.test.ts `
  src/core/character/playerJourneyConsistency.test.ts `
  src/core/character/playReadiness.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Character Hub or player journey certification failed."
}

Write-Host ""
Write-Host "[3/7] Navigation and search suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/discovery/navigationSearchDiscovery.test.ts `
  src/certification/integration/navigationSearchDiscoveryContract.test.ts `
  src/certification/differential/navigationSearchRouteParity.test.ts `
  src/certification/integration/navigationSearchUiFinalClosureContract.test.ts `
  src/certification/golden/navigationSearchGoldenIntentIntegration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Navigation or search certification failed."
}

Write-Host ""
Write-Host "[4/7] Backup, transfer and persistence suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Backup, transfer or persistence certification failed."
}

Write-Host ""
Write-Host "[5/7] Accessibility, performance and release gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/onboarding/onboardingProgress-v5.143.test.ts `
  src/core/quality/uiMobileAccessibilityPolish.test.ts `
  src/core/qa/mobileAccessibilityPerformance.test.ts `
  src/core/performance/bundlePerformanceBudget-v5.142.test.ts `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/releasePackaging-v5.144.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Accessibility, performance or release certification failed."
}

Write-Host ""
Write-Host "[6/7] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[7/7] Production build" -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Production build failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\PLAYER_EXPERIENCE_RELEASE_MATRIX_v6.2C9.json"
Write-Host "  reports\PLAYER_EXPERIENCE_RELEASE_MATRIX_v6.2C9.md"
Write-Host ""
Write-Host "v6.2C9 GREEN - Player experience and release closure passed." -ForegroundColor Green
