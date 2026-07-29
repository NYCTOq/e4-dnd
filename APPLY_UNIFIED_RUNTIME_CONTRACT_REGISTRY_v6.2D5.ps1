$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D5 Unified Runtime Contract Registry starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/7] Unified runtime contract registry" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/unifiedRuntimeContractRegistry-v6.2D5.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D5 RED - unified runtime registry has blockers." -ForegroundColor Red
  Write-Host "Read reports\UNIFIED_RUNTIME_CONTRACT_REGISTRY_v6.2D5.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/7] Previous runtime automation wave suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/guidedRuntimeGapClosure-v6.2D1.test.ts `
  src/certification/player-readiness/guidedFeatureAutomationWave1-v6.2D2.test.ts `
  src/certification/player-readiness/battlefieldAutomationWave2-v6.2D3.test.ts `
  src/certification/player-readiness/narrativeGuidanceWave3-v6.2D4.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Previous automation wave certification failed."
}

Write-Host ""
Write-Host "[3/7] Runtime coverage and missing-gap suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/discovery/runtimeCoverageDiscovery.test.ts `
  src/certification/matrix/runtimeCoverageMetadataMatrix.test.ts `
  src/certification/differential/runtimeCoverageDifferential.test.ts `
  src/certification/integration/runtimeCoverageMissingClosure.test.ts `
  src/core/rulesets/runtimeCoverageClosure.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Runtime coverage consolidation failed."
}

Write-Host ""
Write-Host "[4/7] Play Mode and persistence contract suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playActionHistory.test.ts `
  src/core/runtime/manualRuntimeBridge-v5.135.test.ts `
  src/certification/integration/classFeaturePersistenceBridge.test.ts `
  src/certification/matrix/classFeatureUsagePersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Play Mode or persistence contract certification failed."
}

Write-Host ""
Write-Host "[5/7] Release readiness gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Release readiness gate failed."
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
Write-Host "  reports\UNIFIED_RUNTIME_CONTRACT_REGISTRY_v6.2D5.json"
Write-Host "  reports\UNIFIED_RUNTIME_CONTRACT_REGISTRY_v6.2D5.md"
Write-Host ""
Write-Host "v6.2D5 GREEN - Unified runtime contract registry and release gates passed." -ForegroundColor Green
