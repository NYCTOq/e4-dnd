$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C5 Spellcasting Runtime Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/6] 64-scenario spellcasting runtime matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/spellcastingRuntimeMatrix-v6.2C5.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C5 RED - spellcasting runtime matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\SPELLCASTING_RUNTIME_MATRIX_v6.2C5.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/6] Spell selection and casting persistence suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellBuilderOfficial.test.ts `
  src/core/rulesets/builderSpellIntegration.test.ts `
  src/certification/integration/spellCastingPersistenceBridge.test.ts `
  src/certification/matrix/spellCastingUiPersistenceMatrix.test.ts `
  src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Spell selection or persistence certification failed."
}

Write-Host ""
Write-Host "[3/6] Concentration, control and spell runtime suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellControlOfficial.test.ts `
  src/core/rulesets/globalSpellRuntime.test.ts `
  src/core/rulesets/spellRuntimeOfficial2024.test.ts `
  src/core/rulesets/spellRuntimeCompletion-v5.132.test.ts `
  src/certification/differential/spellRuntimeCombatDifferential.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Spell runtime certification failed."
}

Write-Host ""
Write-Host "[4/6] Summon, persistent, defense and movement spell suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellSummonPersistentOfficial.test.ts `
  src/core/rulesets/spellDefenseMovementOfficial.test.ts `
  src/core/rulesets/spellEffectRules.test.ts `
  src/core/rulesets/spellBehaviorRules.test.ts `
  src/core/rulesets/spellResolution.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Advanced spell behavior certification failed."
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
Write-Host "  reports\SPELLCASTING_RUNTIME_MATRIX_v6.2C5.json"
Write-Host "  reports\SPELLCASTING_RUNTIME_MATRIX_v6.2C5.md"
Write-Host ""
Write-Host "v6.2C5 GREEN - All 64 spellcasting runtime scenarios passed." -ForegroundColor Green
