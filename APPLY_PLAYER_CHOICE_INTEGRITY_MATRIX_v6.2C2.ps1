$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C2 Player Choice Integrity Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/5] 144-scenario player choice integrity matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/playerChoiceIntegrityMatrix-v6.2C2.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C2 RED - player choice matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\PLAYER_CHOICE_INTEGRITY_MATRIX_v6.2C2.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/5] Race, ancestry, background and feat suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/ancestryChoiceRules.test.ts `
  src/core/rulesets/ancestryRuntimeRules.test.ts `
  src/core/rulesets/classBackgroundOracle.test.ts `
  src/core/rulesets/featOfficialCertification.test.ts `
  src/core/rulesets/featCatalog2024Official.test.ts `
  src/core/rulesets/advancedFeatRuntimeRules.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Race, background or feat certification failed."
}

Write-Host ""
Write-Host "[3/5] Spell builder and runtime suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/spellBuilderOfficial.test.ts `
  src/core/rulesets/builderSpellIntegration.test.ts `
  src/core/rulesets/spellControlOfficial.test.ts `
  src/core/rulesets/spellRuntimeOfficial2024.test.ts `
  src/core/rulesets/spellCertificationExpansion.test.ts `
  src/core/rulesets/spellExpansion.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Spell certification failed."
}

Write-Host ""
Write-Host "[4/5] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[5/5] Production build" -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Production build failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\PLAYER_CHOICE_INTEGRITY_MATRIX_v6.2C2.json"
Write-Host "  reports\PLAYER_CHOICE_INTEGRITY_MATRIX_v6.2C2.md"
Write-Host ""
Write-Host "v6.2C2 GREEN - Race, background, feat and spell choices passed 144 scenarios." -ForegroundColor Green
