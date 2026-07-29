$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C1 All-Class Character Creation Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/5] 192-scenario all-class creation matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/allClassCharacterCreationMatrix-v6.2C1.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C1 RED - character creation matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\ALL_CLASS_CHARACTER_CREATION_MATRIX_v6.2C1.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/5] All twelve class builder certifications" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/barbarianBuilderCertification.test.ts `
  src/core/rulesets/bardBuilderCertification.test.ts `
  src/core/rulesets/clericBuilderCertification.test.ts `
  src/core/rulesets/druidBuilderCertification.test.ts `
  src/core/rulesets/fighterBuilderCertification.test.ts `
  src/core/rulesets/monkBuilderCertification.test.ts `
  src/core/rulesets/paladinBuilderCertification.test.ts `
  src/core/rulesets/rangerBuilderCertification.test.ts `
  src/core/rulesets/rogueBuilderCertification.test.ts `
  src/core/rulesets/sorcererBuilderCertification.test.ts `
  src/core/rulesets/warlockBuilderCertification.test.ts `
  src/core/rulesets/wizardBuilderCertification.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "All-class builder certification failed."
}

Write-Host ""
Write-Host "[3/5] Character creation and level 1-20 journey suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/fullCharacterCreationJourney.test.ts `
  src/core/rulesets/levelOneToTwentyJourney.test.ts `
  src/core/rulesets/singleClassPlayableReadiness.test.ts `
  src/core/rulesets/fullCharacterCertification.integration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Character journey certification failed."
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
Write-Host "  reports\ALL_CLASS_CHARACTER_CREATION_MATRIX_v6.2C1.json"
Write-Host "  reports\ALL_CLASS_CHARACTER_CREATION_MATRIX_v6.2C1.md"
Write-Host ""
Write-Host "v6.2C1 GREEN - All 12 classes passed the 192-scenario character creation matrix." -ForegroundColor Green
