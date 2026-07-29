$ErrorActionPreference = "Stop"
Write-Host "E4 D&D F-MEGA2 Content Expansion and Catalog Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/11] Content expansion and catalog manifest" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/contentExpansionCatalogClosure-F-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "F-MEGA2 RED - catalog manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\CONTENT_EXPANSION_CATALOG_CLOSURE_F_MEGA2.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/11] Class and subclass catalog closure" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/discovery/classSubclassCatalogIntegrityDiscovery.test.ts `
  src/certification/golden/classSubclassCatalogGoldenIntegration.test.ts `
  src/core/rulesets/subclassExpansion.test.ts `
  src/core/rulesets/contentIntegrityAudit.test.ts
if ($LASTEXITCODE -ne 0) { throw "Class or subclass catalog closure failed." }

Write-Host ""
Write-Host "[3/11] Spell catalog, builder and runtime" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellExpansion.test.ts `
  src/core/rulesets/spellCertificationExpansion.test.ts `
  src/core/rulesets/spellBuilderOfficial.test.ts `
  src/core/rulesets/globalSpellRuntime.test.ts `
  src/certification/integration/spellUiContract.test.ts
if ($LASTEXITCODE -ne 0) { throw "Spell catalog or runtime closure failed." }

Write-Host ""
Write-Host "[4/11] Feat, origin and ancestry catalogs" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/featOfficialCertification.test.ts `
  src/core/rulesets/featCatalog2024Official.test.ts `
  src/certification/player-readiness/originFeatRuntimeMatrix-v6.2C7.test.ts `
  src/certification/oracle/classBackgroundOracle.test.ts `
  src/core/rulesets/ancestryChoiceRules.test.ts
if ($LASTEXITCODE -ne 0) { throw "Feat, origin or ancestry catalog closure failed." }

Write-Host ""
Write-Host "[5/11] Equipment, item and magic-item catalogs" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/itemExpansion.test.ts `
  src/core/rulesets/itemUseRules.test.ts `
  src/core/rulesets/itemEffectRuntimeRules.test.ts `
  src/core/rulesets/magicItemRules.test.ts `
  src/core/rulesets/equipmentMagicItemFinalCoverage.integration.test.ts
if ($LASTEXITCODE -ne 0) { throw "Item catalog closure failed." }

Write-Host ""
Write-Host "[6/11] Builder and choice integration" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/builder/builderGuidance.test.ts `
  src/core/rulesets/unifiedCharacterChoices.test.ts `
  src/core/rulesets/levelUpChoiceCompletion.test.ts `
  src/core/rulesets/builderSpellIntegration.test.ts `
  src/core/rulesets/fullCharacterCertification.integration.test.ts
if ($LASTEXITCODE -ne 0) { throw "Builder or choice integration failed." }

Write-Host ""
Write-Host "[7/11] Search and discovery closure" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/search/globalSearch.test.ts `
  src/certification/discovery/navigationSearchDiscovery.test.ts `
  src/certification/integration/navigationSearchDiscoveryContract.test.ts `
  src/certification/differential/navigationSearchRouteParity.test.ts `
  src/certification/integration/navigationSearchGoldenIntentContract.test.ts
if ($LASTEXITCODE -ne 0) { throw "Search or discovery closure failed." }

Write-Host ""
Write-Host "[8/11] Homebrew import, runtime and security" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/homebrew/homebrewPackageSharing.test.ts `
  src/core/homebrew/homebrewCreator.test.ts `
  src/core/homebrew/homebrewBuilderIntegration.test.ts `
  src/core/homebrew/homebrewRuntimeIntegration.test.ts `
  src/core/homebrew/homebrewMarketplaceSecurity.test.ts `
  src/core/homebrew/homebrewSecurityResolution.test.ts
if ($LASTEXITCODE -ne 0) { throw "Homebrew import or security closure failed." }

Write-Host ""
Write-Host "[9/11] Catalog to Play Mode actionability" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playReadiness.test.ts `
  src/certification/integration/characterHubActionabilityContract.test.ts `
  src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts
if ($LASTEXITCODE -ne 0) { throw "Catalog to Play Mode closure failed." }

Write-Host ""
Write-Host "[10/11] Production build and browser catalog closure" -ForegroundColor Yellow
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

npx.cmd playwright test e2e/content-catalog-expansion-F-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Browser catalog closure failed." }

Write-Host ""
Write-Host "[11/11] Full suite and mega regression" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

npx.cmd vitest run `
  src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts `
  src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts `
  src/certification/player-readiness/contentAccuracyRulesetDifferential-F-MEGA1.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Mega regression failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\CONTENT_EXPANSION_CATALOG_CLOSURE_F_MEGA2.json"
Write-Host "  reports\CONTENT_EXPANSION_CATALOG_CLOSURE_F_MEGA2.md"
Write-Host ""
Write-Host "F-MEGA2 GREEN - Catalogs, builder, discovery, homebrew and Play Mode content closure passed." -ForegroundColor Green
