$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2C6 Subclass Runtime Matrix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/6] All-subclass runtime matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/subclassRuntimeMatrix-v6.2C6.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2C6 RED - subclass runtime matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\SUBCLASS_RUNTIME_MATRIX_v6.2C6.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/6] Subclass catalog and expansion suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/subclassExpansion.test.ts `
  src/core/rulesets/subclassRules.test.ts `
  src/certification/discovery/classSubclassCatalogIntegrityDiscovery.test.ts `
  src/certification/differential/classSubclassCatalogDifferential.test.ts `
  src/certification/golden/classSubclassCatalogGoldenIntegration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Subclass catalog certification failed."
}

Write-Host ""
Write-Host "[3/6] Subclass runtime and coverage suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/subclassRuntimeRules.test.ts `
  src/core/rulesets/subclassRuntimeCompletion-v5.131.test.ts `
  src/core/rulesets/classSubclassRuntimeClosure.test.ts `
  src/certification/differential/classSubclassRuntimeDifferential.test.ts `
  src/certification/matrix/classSubclassRuntimeScenarioMatrix.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Subclass runtime certification failed."
}

Write-Host ""
Write-Host "[4/6] Subclass persistence and UI suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/matrix/classSubclassPersistenceMatrix.test.ts `
  src/certification/integration/classSubclassUiContract.test.ts `
  src/certification/golden/classSubclassGoldenCharacters.test.ts `
  src/certification/oracle/classSubclassRuntimeOracle.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Subclass persistence or UI certification failed."
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
Write-Host "  reports\SUBCLASS_RUNTIME_MATRIX_v6.2C6.json"
Write-Host "  reports\SUBCLASS_RUNTIME_MATRIX_v6.2C6.md"
Write-Host ""
Write-Host "v6.2C6 GREEN - All subclass runtime scenarios passed." -ForegroundColor Green
