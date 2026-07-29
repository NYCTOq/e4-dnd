$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D6 Final Playable Runtime Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/8] Final playable feature scenario matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D6 RED - playable runtime closure has blockers." -ForegroundColor Red
  Write-Host "Read reports\FINAL_PLAYABLE_RUNTIME_CLOSURE_v6.2D6.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/8] Unified runtime registry and automation waves" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/guidedRuntimeGapClosure-v6.2D1.test.ts `
  src/certification/player-readiness/guidedFeatureAutomationWave1-v6.2D2.test.ts `
  src/certification/player-readiness/battlefieldAutomationWave2-v6.2D3.test.ts `
  src/certification/player-readiness/narrativeGuidanceWave3-v6.2D4.test.ts `
  src/certification/player-readiness/unifiedRuntimeContractRegistry-v6.2D5.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Runtime automation regression failed."
}

Write-Host ""
Write-Host "[3/8] Character sheet and Play Mode visibility" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playReadiness.test.ts `
  src/core/rulesets/characterSheetCertification.test.ts `
  src/certification/integration/classSubclassUiContract.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Character sheet or Play Mode visibility failed."
}

Write-Host ""
Write-Host "[4/8] Actionability and runtime execution" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/character/playActionHistory.test.ts `
  src/core/runtime/manualRuntimeBridge-v5.135.test.ts `
  src/core/session/sessionPlayLoop-v5.134.test.ts `
  src/certification/integration/characterHubActionabilityContract.test.ts `
  src/certification/differential/characterHubActionabilityDifferential.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Play Mode actionability failed."
}

Write-Host ""
Write-Host "[5/8] Persistence, hydration and recovery" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/integration/classFeaturePersistenceBridge.test.ts `
  src/certification/matrix/classFeatureUsagePersistenceMatrix.test.ts `
  src/certification/matrix/classSubclassPersistenceMatrix.test.ts `
  src/core/storage/characterHydration.test.ts `
  src/features/backup/backupRecovery.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Runtime persistence or recovery failed."
}

Write-Host ""
Write-Host "[6/8] Final release gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Final release readiness failed."
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
Write-Host "  reports\FINAL_PLAYABLE_RUNTIME_CLOSURE_v6.2D6.json"
Write-Host "  reports\FINAL_PLAYABLE_RUNTIME_CLOSURE_v6.2D6.md"
Write-Host ""
Write-Host "v6.2D6 GREEN - Every subclass feature is visible, actionable, persistent and release-ready." -ForegroundColor Green
