$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D3 Battlefield Automation Wave 2 starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/7] Full battlefield feature routing matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/battlefieldAutomationWave2-v6.2D3.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D3 RED - battlefield automation matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\BATTLEFIELD_AUTOMATION_WAVE2_v6.2D3.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/7] Conditions, control and targeting suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellControlOfficial.test.ts `
  src/core/rulesets/spellTargetRules.test.ts `
  src/core/rulesets/spellBehaviorRules.test.ts `
  src/core/rulesets/spellEffectRules.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Condition, control or targeting certification failed."
}

Write-Host ""
Write-Host "[3/7] Movement and battlefield-zone suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellDefenseMovementOfficial.test.ts `
  src/features/combat-tracker/battlefieldZones.test.ts `
  src/features/combat-tracker/combatEncounterBridge.test.ts `
  src/core/rulesets/combatAutomationRuntime.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Movement or battlefield-zone certification failed."
}

Write-Host ""
Write-Host "[4/7] Summon and companion persistence suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellSummonPersistentOfficial.test.ts `
  src/core/rulesets/companionRules.test.ts `
  src/certification/integration/runtimeEntityPersistenceBridge.test.ts `
  src/certification/golden/runtimeEntityGoldenIntegration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Summon or companion certification failed."
}

Write-Host ""
Write-Host "[5/7] Spell runtime combat and persistence suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/oracle/spellRuntimeCombatOracle.test.ts `
  src/certification/differential/spellRuntimeCombatDifferential.test.ts `
  src/certification/matrix/spellRuntimeCombatScenarioMatrix.test.ts `
  src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Spell runtime battlefield certification failed."
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
Write-Host "  reports\BATTLEFIELD_AUTOMATION_WAVE2_v6.2D3.json"
Write-Host "  reports\BATTLEFIELD_AUTOMATION_WAVE2_v6.2D3.md"
Write-Host ""
Write-Host "v6.2D3 GREEN - Every subclass feature is routed to a battlefield engine or guided resolution." -ForegroundColor Green
