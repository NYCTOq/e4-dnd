$ErrorActionPreference = "Stop"
Write-Host "E4 D&D F-MEGA1 Content Accuracy and Ruleset Differential starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Accuracy manifest" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/contentAccuracyRulesetDifferential-F-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "F-MEGA1 RED - content accuracy manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\CONTENT_ACCURACY_RULESET_DIFFERENTIAL_F_MEGA1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/10] Class progression and level-up accuracy" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/oracle/levelUpProgressionOracle.test.ts `
  src/certification/differential/levelUpProgressionDifferential.test.ts `
  src/core/rulesets/martialOfficialProgression.test.ts `
  src/core/rulesets/clericDruidOfficialProgression.test.ts `
  src/core/rulesets/bardSorcererOfficialProgression.test.ts `
  src/core/rulesets/warlockWizardOfficialProgression.test.ts `
  src/core/rulesets/halfCasterOfficialProgression.test.ts
if ($LASTEXITCODE -ne 0) { throw "Class progression accuracy failed." }

Write-Host ""
Write-Host "[3/10] Subclass progression and runtime accuracy" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/subclassExpansion.test.ts `
  src/core/rulesets/subclassRuntimeRules.test.ts `
  src/certification/matrix/classSubclassRuntimeScenarioMatrix.test.ts `
  src/certification/differential/classSubclassRuntimeDifferential.test.ts `
  src/certification/oracle/classSubclassRuntimeOracle.test.ts
if ($LASTEXITCODE -ne 0) { throw "Subclass progression accuracy failed." }

Write-Host ""
Write-Host "[4/10] Spellcasting and spell-runtime accuracy" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/oracle/spellcastingOracle.test.ts `
  src/certification/player-readiness/spellcastingRuntimeMatrix-v6.2C5.test.ts `
  src/core/rulesets/spellBuilderOfficial.test.ts `
  src/core/rulesets/spellRuntimeOfficial2024.test.ts `
  src/core/rulesets/damageSaveSpellOfficial.test.ts `
  src/core/rulesets/spellControlOfficial.test.ts `
  src/core/rulesets/spellDefenseMovementOfficial.test.ts `
  src/core/rulesets/spellSummonPersistentOfficial.test.ts
if ($LASTEXITCODE -ne 0) { throw "Spellcasting accuracy failed." }

Write-Host ""
Write-Host "[5/10] Feat, origin and ancestry accuracy" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/featOfficialCertification.test.ts `
  src/core/rulesets/featCatalog2024Official.test.ts `
  src/certification/player-readiness/originFeatRuntimeMatrix-v6.2C7.test.ts `
  src/certification/oracle/classBackgroundOracle.test.ts `
  src/core/rulesets/ancestryChoiceRules.test.ts
if ($LASTEXITCODE -ne 0) { throw "Feat, origin or ancestry accuracy failed." }

Write-Host ""
Write-Host "[6/10] Multiclass and pact-magic accuracy" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/multiclassOfficialCertification.test.ts `
  src/core/rulesets/multiclassRules.test.ts `
  src/core/rulesets/multiclassSpellcastingSeparation.test.ts `
  src/core/rulesets/multiclassPactMagic.test.ts `
  src/certification/player-readiness/multiclassRuntimeMatrix-v6.2C8.test.ts `
  src/certification/oracle/advancedMulticlassOracle.test.ts `
  src/certification/differential/advancedMulticlassDifferential.test.ts
if ($LASTEXITCODE -ne 0) { throw "Multiclass accuracy failed." }

Write-Host ""
Write-Host "[7/10] Equipment and magic-item accuracy" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/oracle/equipmentCombatOracle.test.ts `
  src/certification/differential/equipmentCombatDifferential.test.ts `
  src/certification/matrix/equipmentCombatScenarioMatrix.test.ts `
  src/core/rulesets/magicItemRules.test.ts `
  src/core/rulesets/itemEffectRuntimeRules.test.ts `
  src/core/rulesets/equipmentMagicItemFinalCoverage.test.ts
if ($LASTEXITCODE -ne 0) { throw "Equipment or magic-item accuracy failed." }

Write-Host ""
Write-Host "[8/10] 2014 and 2024 ruleset differentials" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/differential/crossDomainBuilderRecordSheetDifferential.test.ts `
  src/certification/differential/classSubclassRuntimeDifferential.test.ts `
  src/certification/differential/spellRuntimeCombatDifferential.test.ts `
  src/certification/differential/restRecoveryDifferential.test.ts `
  src/certification/differential/deathDyingDifferential.test.ts `
  src/certification/differential/runtimeCoverageDifferential.test.ts
if ($LASTEXITCODE -ne 0) { throw "Ruleset differential accuracy failed." }

Write-Host ""
Write-Host "[9/10] Content integrity and release audit" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/contentIntegrityAudit.test.ts `
  src/core/rulesets/contentIntegrityAudit.integration.test.ts `
  src/core/rulesets/fullCharacterCertification.integration.test.ts `
  src/core/rulesets/runtimeCoverageCertification.integration.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) { throw "Content integrity or release audit failed." }

Write-Host ""
Write-Host "[10/10] Full suite, production build and mega regression" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

npx.cmd vitest run `
  src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts `
  src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Mega regression failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\CONTENT_ACCURACY_RULESET_DIFFERENTIAL_F_MEGA1.json"
Write-Host "  reports\CONTENT_ACCURACY_RULESET_DIFFERENTIAL_F_MEGA1.md"
Write-Host ""
Write-Host "F-MEGA1 GREEN - Class, subclass, spell, feat, multiclass, equipment and ruleset accuracy passed." -ForegroundColor Green
