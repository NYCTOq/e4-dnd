$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D2 Guided Feature Automation Wave 1 starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/7] Full feature-to-runtime-engine routing matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/guidedFeatureAutomationWave1-v6.2D2.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D2 RED - automation routing matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\GUIDED_FEATURE_AUTOMATION_WAVE1_v6.2D2.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/7] Damage and defense runtime suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/damageSaveSpellOfficial.test.ts `
  src/core/rulesets/combatAutomationRuntime.test.ts `
  src/core/rulesets/itemEffectRuntimeRules.test.ts `
  src/core/rulesets/magicItemRules.test.ts `
  src/certification/differential/equipmentCombatDifferential.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Damage or defense runtime certification failed."
}

Write-Host ""
Write-Host "[3/7] Healing, rest and recovery suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/rest/restAutomation.test.ts `
  src/features/rest/restSheetPlayIntegration.test.ts `
  src/certification/oracle/restRecoveryOracle.test.ts `
  src/certification/differential/restRecoveryDifferential.test.ts `
  src/certification/matrix/restRecoveryPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Healing or rest runtime certification failed."
}

Write-Host ""
Write-Host "[4/7] Resource and class feature runtime suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/classFeatureEngine.test.ts `
  src/core/rulesets/classFeatureRuntime.test.ts `
  src/core/rulesets/classSpecificRuntimePolicy.test.ts `
  src/certification/integration/classFeaturePersistenceBridge.test.ts `
  src/certification/matrix/classFeatureUsagePersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Resource or class feature runtime certification failed."
}

Write-Host ""
Write-Host "[5/7] Guided/manual Play Mode bridge suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/runtime/manualRuntimeBridge-v5.135.test.ts `
  src/core/session/sessionPlayLoop-v5.134.test.ts `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playActionHistory.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Guided Play Mode bridge certification failed."
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
Write-Host "  reports\GUIDED_FEATURE_AUTOMATION_WAVE1_v6.2D2.json"
Write-Host "  reports\GUIDED_FEATURE_AUTOMATION_WAVE1_v6.2D2.md"
Write-Host ""
Write-Host "v6.2D2 GREEN - Every subclass feature is routed to a runtime engine or guided resolution." -ForegroundColor Green
