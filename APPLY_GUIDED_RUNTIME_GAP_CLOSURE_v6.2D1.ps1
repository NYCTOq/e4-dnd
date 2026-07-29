$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D1 Guided Runtime Gap Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/7] Full subclass feature automation-tier matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/guidedRuntimeGapClosure-v6.2D1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D1 RED - runtime gap matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\GUIDED_RUNTIME_GAP_CLOSURE_v6.2D1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/7] Runtime coverage discovery and metadata suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/discovery/runtimeCoverageDiscovery.test.ts `
  src/certification/matrix/runtimeCoverageMetadataMatrix.test.ts `
  src/certification/differential/runtimeCoverageDifferential.test.ts `
  src/core/rulesets/runtimeCoverageCertification.test.ts `
  src/core/rulesets/runtimeCoverageCertification.integration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Runtime coverage certification failed."
}

Write-Host ""
Write-Host "[3/7] Class and subclass runtime closure suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/classFeatureRuntime.test.ts `
  src/core/rulesets/classRuntimeCompletion-v5.130.test.ts `
  src/core/rulesets/subclassRuntimeCompletion-v5.131.test.ts `
  src/core/rulesets/classSubclassRuntimeClosure.test.ts `
  src/core/rulesets/runtimeCoverageClosure.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Class or subclass runtime closure failed."
}

Write-Host ""
Write-Host "[4/7] Missing-gap and manual-runtime bridge suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/runtimeGapClosure.test.ts `
  src/certification/integration/runtimeCoverageMissingClosure.test.ts `
  src/core/runtime/manualRuntimeBridge-v5.135.test.ts `
  src/core/session/sessionPlayLoop-v5.134.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Runtime gap or manual bridge certification failed."
}

Write-Host ""
Write-Host "[5/7] Persistence and Play Mode suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/integration/classFeaturePersistenceBridge.test.ts `
  src/certification/matrix/classFeatureUsagePersistenceMatrix.test.ts `
  src/certification/matrix/classSubclassPersistenceMatrix.test.ts `
  src/core/character/sheetPlayModeConsistency.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Runtime persistence certification failed."
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
Write-Host "  reports\GUIDED_RUNTIME_GAP_CLOSURE_v6.2D1.json"
Write-Host "  reports\GUIDED_RUNTIME_GAP_CLOSURE_v6.2D1.md"
Write-Host ""
Write-Host "v6.2D1 GREEN - All subclass features have an explicit runtime policy." -ForegroundColor Green
