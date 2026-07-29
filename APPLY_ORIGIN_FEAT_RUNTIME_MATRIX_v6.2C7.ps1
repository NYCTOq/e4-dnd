$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C7 Origin and Feat Runtime Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/6] 168-scenario origin and feat runtime matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/originFeatRuntimeMatrix-v6.2C7.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C7 RED - origin and feat matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\ORIGIN_FEAT_RUNTIME_MATRIX_v6.2C7.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/6] Ancestry and origin suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/ancestryChoiceRules.test.ts `
  src/core/rulesets/ancestryRuntimeRules.test.ts `
  src/core/rulesets/levelOneAncestryReadiness.test.ts `
  src/core/rulesets/levelOneOriginReadiness.test.ts `
  src/core/rulesets/levelOneSocialReadiness.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Ancestry or origin certification failed."
}

Write-Host ""
Write-Host "[3/6] Background and proficiency suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/oracle/classBackgroundOracle.test.ts `
  src/core/rulesets/levelOneProficiencyReadiness.test.ts `
  src/core/rulesets/abilityGenerationRules.test.ts `
  src/certification/oracle/abilityProficiencyOracle.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Background or proficiency certification failed."
}

Write-Host ""
Write-Host "[4/6] Feat, ASI and high-level advancement suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/featOfficialCertification.test.ts `
  src/core/rulesets/featCatalog2024Official.test.ts `
  src/core/rulesets/advancedFeatRuntimeRules.test.ts `
  src/core/rulesets/highLevelAbilityBuilder.test.ts `
  src/core/rulesets/levelUpAdvancementReadiness.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Feat or advancement certification failed."
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
Write-Host "  reports\ORIGIN_FEAT_RUNTIME_MATRIX_v6.2C7.json"
Write-Host "  reports\ORIGIN_FEAT_RUNTIME_MATRIX_v6.2C7.md"
Write-Host ""
Write-Host "v6.2C7 GREEN - All 168 origin and feat runtime scenarios passed." -ForegroundColor Green
