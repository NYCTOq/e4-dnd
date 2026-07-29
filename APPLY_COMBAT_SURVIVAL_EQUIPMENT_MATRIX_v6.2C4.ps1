$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C4 Combat, Survival and Equipment Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/6] 96-scenario integrated combat matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/combatSurvivalEquipmentMatrix-v6.2C4.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C4 RED - combat matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\COMBAT_SURVIVAL_EQUIPMENT_MATRIX_v6.2C4.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/6] Attack, damage and combat automation suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/attackResolution.test.ts `
  src/core/rulesets/combatAutomationRuntime.test.ts `
  src/core/rulesets/combatTurnRules.test.ts `
  src/core/rulesets/damageSaveSpellOfficial.test.ts `
  src/certification/differential/equipmentCombatDifferential.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Attack or combat automation certification failed."
}

Write-Host ""
Write-Host "[3/6] Equipment and magic item suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/equipmentRuntimeRules.test.ts `
  src/core/rulesets/equipmentClosureRuntime.test.ts `
  src/core/rulesets/equipmentMagicItemFinalCoverage.integration.test.ts `
  src/core/rulesets/itemEffectRuntimeRules.test.ts `
  src/core/rulesets/magicItemRules.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Equipment certification failed."
}

Write-Host ""
Write-Host "[4/6] Death, dying, rest and persistence suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/integration/deathDyingPlayModeIntegration.test.ts `
  src/certification/differential/deathDyingDifferential.test.ts `
  src/certification/matrix/deathDyingScenarioMatrix.test.ts `
  src/certification/differential/restRecoveryDifferential.test.ts `
  src/certification/matrix/restRecoveryPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Death, dying or rest certification failed."
}

Write-Host ""
Write-Host "[5/6] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[6/6] Production build" -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Production build failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\COMBAT_SURVIVAL_EQUIPMENT_MATRIX_v6.2C4.json"
Write-Host "  reports\COMBAT_SURVIVAL_EQUIPMENT_MATRIX_v6.2C4.md"
Write-Host ""
Write-Host "v6.2C4 GREEN - All 96 combat, survival and equipment scenarios passed." -ForegroundColor Green
