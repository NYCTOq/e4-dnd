$ErrorActionPreference = "Stop"
Write-Host "E4 D&D E-MEGA2 Combat and Spell Automation Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/11] Combat and spell automation manifest" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "E-MEGA2 RED - automation manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\COMBAT_SPELL_AUTOMATION_E_MEGA2.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/11] Initiative, turn flow and combat tracker" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/combat-tracker/combatTrackerStorage.test.ts `
  src/features/combat-tracker/combatEncounterBridge.test.ts `
  src/features/combat-tracker/combatLogStorage.test.ts `
  src/core/session/sessionPlayLoop-v5.134.test.ts
if ($LASTEXITCODE -ne 0) { throw "Initiative or turn-flow certification failed." }

Write-Host ""
Write-Host "[3/11] Conditions, reactions and combat automation" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/combatAutomationRuntime.test.ts `
  src/core/rulesets/spellControlOfficial.test.ts `
  src/core/rulesets/spellEffectRules.test.ts `
  src/core/rulesets/damageSaveSpellOfficial.test.ts
if ($LASTEXITCODE -ne 0) { throw "Condition, reaction or combat automation failed." }

Write-Host ""
Write-Host "[4/11] Concentration, targeting and spell behavior" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellTargetRules.test.ts `
  src/core/rulesets/spellBehaviorRules.test.ts `
  src/core/rulesets/globalSpellRuntime.test.ts `
  src/certification/integration/spellUiContract.test.ts `
  src/certification/integration/spellCastingPersistenceBridge.test.ts
if ($LASTEXITCODE -ne 0) { throw "Concentration, targeting or spell behavior failed." }

Write-Host ""
Write-Host "[5/11] Auras, movement and battlefield zones" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellDefenseMovementOfficial.test.ts `
  src/features/combat-tracker/battlefieldZones.test.ts `
  src/certification/matrix/spellRuntimeCombatScenarioMatrix.test.ts `
  src/certification/differential/spellRuntimeCombatDifferential.test.ts
if ($LASTEXITCODE -ne 0) { throw "Aura, movement or battlefield-zone certification failed." }

Write-Host ""
Write-Host "[6/11] Summons, companions and runtime entities" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellSummonPersistentOfficial.test.ts `
  src/core/rulesets/companionRules.test.ts `
  src/certification/integration/runtimeEntityPersistenceBridge.test.ts `
  src/certification/golden/runtimeEntityGoldenIntegration.test.ts
if ($LASTEXITCODE -ne 0) { throw "Summon, companion or runtime-entity certification failed." }

Write-Host ""
Write-Host "[7/11] Upcasting, class resources and rest recovery" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/spellcastingRuntimeMatrix-v6.2C5.test.ts `
  src/core/rulesets/classFeatureRuntime.test.ts `
  src/core/rulesets/classFeatureEngine.test.ts `
  src/features/rest/restAutomation.test.ts `
  src/certification/matrix/restRecoveryPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) { throw "Upcasting, resource or rest recovery certification failed." }

Write-Host ""
Write-Host "[8/11] Death saves and combat persistence" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/integration/deathDyingPlayModeIntegration.test.ts `
  src/certification/matrix/deathDyingCharacterPersistenceMatrix.test.ts `
  src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) { throw "Death-save or combat persistence certification failed." }

Write-Host ""
Write-Host "[9/11] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Clean production build failed." }

Write-Host ""
Write-Host "[10/11] Desktop and mobile browser combat shell" -ForegroundColor Yellow
npx.cmd playwright test e2e/combat-spell-automation-E-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Browser combat and spell shell failed." }

Write-Host ""
Write-Host "[11/11] Full unit, integration and release regression" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

npx.cmd vitest run `
  src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts `
  src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Mega journey or release regression failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\COMBAT_SPELL_AUTOMATION_E_MEGA2.json"
Write-Host "  reports\COMBAT_SPELL_AUTOMATION_E_MEGA2.md"
Write-Host ""
Write-Host "E-MEGA2 GREEN - Combat, spell, summon, concentration, rest and persistence automation passed." -ForegroundColor Green
