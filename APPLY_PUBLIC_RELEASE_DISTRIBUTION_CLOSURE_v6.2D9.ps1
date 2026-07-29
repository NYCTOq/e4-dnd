$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D9 Public Release Distribution Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/8] Public distribution manifest certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D9 RED - public distribution manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\PUBLIC_RELEASE_DISTRIBUTION_CLOSURE_v6.2D9.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/8] Release candidate and packaging regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/releaseCandidateCertification-v6.2D8.test.ts `
  src/core/release/releasePackaging-v5.144.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts `
  src/core/release/postReleaseQa.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Release candidate or packaging regression failed."
}

Write-Host ""
Write-Host "[3/8] Stable release gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Stable release gate failed."
}

Write-Host ""
Write-Host "[4/8] Bundle, chunks and mobile performance" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/performance/bundlePerformanceBudget-v5.142.test.ts `
  src/core/rulesets/rulesetLoaderChunks.test.ts `
  src/core/qa/mobileAccessibilityPerformance.test.ts `
  src/core/quality/uiMobileAccessibilityPolish.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Distribution performance certification failed."
}

Write-Host ""
Write-Host "[5/8] Backup, transfer and offline recovery" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Backup, transfer or offline recovery failed."
}

Write-Host ""
Write-Host "[6/8] Player shell and navigation closure" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/integration/characterHubUiFinalClosureContract.test.ts `
  src/certification/integration/navigationSearchUiFinalClosureContract.test.ts `
  src/certification/integration/crossDomainUiFinalClosureContract.test.ts `
  src/core/character/playerJourneyConsistency.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Player shell or navigation closure failed."
}

Write-Host ""
Write-Host "[7/8] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[8/8] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Clean production build failed."
}

if (-not (Test-Path ".\dist\index.html")) {
  throw "dist\index.html was not generated."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\PUBLIC_RELEASE_DISTRIBUTION_CLOSURE_v6.2D9.json"
Write-Host "  reports\PUBLIC_RELEASE_DISTRIBUTION_CLOSURE_v6.2D9.md"
Write-Host "  dist\index.html"
Write-Host ""
Write-Host "v6.2D9 GREEN - Public release distribution and clean production build passed." -ForegroundColor Green
