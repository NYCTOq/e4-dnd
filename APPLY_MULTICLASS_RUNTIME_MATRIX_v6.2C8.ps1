$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C8 Multiclass Runtime Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/6] 660-scenario multiclass runtime matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/multiclassRuntimeMatrix-v6.2C8.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C8 RED - multiclass runtime matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\MULTICLASS_RUNTIME_MATRIX_v6.2C8.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/6] Official multiclass rule suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/multiclassRules.test.ts `
  src/core/rulesets/multiclassOfficialCertification.test.ts `
  src/core/rulesets/multiclassSpellcastingSeparation.test.ts `
  src/core/rulesets/advancedMulticlassRules.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Official multiclass certification failed."
}

Write-Host ""
Write-Host "[3/6] Multiclass oracle and differential suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/oracle/advancedMulticlassOracle.test.ts `
  src/certification/differential/advancedMulticlassDifferential.test.ts `
  src/certification/matrix/advancedMulticlassPersistenceMatrix.test.ts `
  src/certification/golden/advancedMulticlassGoldenCharacters.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Multiclass oracle or differential certification failed."
}

Write-Host ""
Write-Host "[4/6] Level-up and persistence bridge suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/integration/levelUpPersistenceBridge.test.ts `
  src/certification/matrix/levelUpProgressionScenarioMatrix.test.ts `
  src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts `
  src/certification/differential/levelUpProgressionDifferential.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Multiclass level-up or persistence certification failed."
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
Write-Host "  reports\MULTICLASS_RUNTIME_MATRIX_v6.2C8.json"
Write-Host "  reports\MULTICLASS_RUNTIME_MATRIX_v6.2C8.md"
Write-Host ""
Write-Host "v6.2C8 GREEN - All 660 multiclass runtime scenarios passed." -ForegroundColor Green
