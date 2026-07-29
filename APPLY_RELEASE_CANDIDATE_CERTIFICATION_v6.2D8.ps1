$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D8 Release Candidate Certification starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/8] Release candidate manifest certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/releaseCandidateCertification-v6.2D8.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D8 RED - release candidate manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\RELEASE_CANDIDATE_CERTIFICATION_v6.2D8.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/8] D1-D7 final runtime regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/guidedRuntimeGapClosure-v6.2D1.test.ts `
  src/certification/player-readiness/guidedFeatureAutomationWave1-v6.2D2.test.ts `
  src/certification/player-readiness/battlefieldAutomationWave2-v6.2D3.test.ts `
  src/certification/player-readiness/narrativeGuidanceWave3-v6.2D4.test.ts `
  src/certification/player-readiness/unifiedRuntimeContractRegistry-v6.2D5.test.ts `
  src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts `
  src/certification/player-readiness/fullPlayerSessionE2EClosure-v6.2D7.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "D1-D7 runtime regression failed."
}

Write-Host ""
Write-Host "[3/8] Stable and public release gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts `
  src/core/release/postReleaseQa.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Stable or public release gate failed."
}

Write-Host ""
Write-Host "[4/8] Packaging and bundle budget" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/releasePackaging-v5.144.test.ts `
  src/core/performance/bundlePerformanceBudget-v5.142.test.ts `
  src/core/rulesets/rulesetLoaderChunks.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Packaging or bundle budget failed."
}

Write-Host ""
Write-Host "[5/8] Accessibility and player-shell closure" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/quality/uiMobileAccessibilityPolish.test.ts `
  src/core/qa/mobileAccessibilityPerformance.test.ts `
  src/certification/integration/characterHubUiFinalClosureContract.test.ts `
  src/certification/integration/navigationSearchUiFinalClosureContract.test.ts `
  src/certification/integration/crossDomainUiFinalClosureContract.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Accessibility or player-shell closure failed."
}

Write-Host ""
Write-Host "[6/8] Backup, transfer and recovery closure" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Backup, transfer or recovery closure failed."
}

Write-Host ""
Write-Host "[7/8] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[8/8] Production build" -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Production build failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\RELEASE_CANDIDATE_CERTIFICATION_v6.2D8.json"
Write-Host "  reports\RELEASE_CANDIDATE_CERTIFICATION_v6.2D8.md"
Write-Host ""
Write-Host "v6.2D8 GREEN - Release candidate certification, packaging and production build passed." -ForegroundColor Green
