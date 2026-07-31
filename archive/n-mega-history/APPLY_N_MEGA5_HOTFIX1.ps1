$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$AuditScript = Join-Path $Root "scripts\n-mega5-level-progression.mjs"
$TestFile = Join-Path $Root "src\certification\player-readiness\nMega5Progression.test.ts"

if (-not (Test-Path $AuditScript)) {
  throw "N-MEGA5 audit script bulunamadi: $AuditScript"
}
if (-not (Test-Path $TestFile)) {
  throw "N-MEGA5 test dosyasi bulunamadi: $TestFile"
}

if (Test-Path (Join-Path $Root 'patch')) { Remove-Item (Join-Path $Root 'patch') -Recurse -Force }
if (Test-Path (Join-Path $Root 'payload')) { Remove-Item (Join-Path $Root 'payload') -Recurse -Force }

Write-Host "N-MEGA5 HOTFIX1: audit calistiriliyor..."
& node $AuditScript
if ($LASTEXITCODE -ne 0) { throw "N-MEGA5 audit RED" }

Write-Host "N-MEGA5 HOTFIX1: regression testleri calistiriliyor..."
& npm.cmd exec vitest run `
  src/certification/player-readiness/nMega5Progression.test.ts `
  src/certification/matrix/levelUpProgressionScenarioMatrix.test.ts `
  src/certification/oracle/progressionOracle.test.ts `
  src/certification/oracle/levelUpProgressionOracle.test.ts `
  src/certification/differential/levelUpProgressionDifferential.test.ts `
  src/core/rulesets/classProgression.test.ts `
  src/core/rulesets/classProgressionAudit.test.ts `
  src/core/rulesets/level20Certification.test.ts `
  src/core/rulesets/level20Certification.integration.test.ts `
  src/core/rulesets/martialOfficialProgression.test.ts `
  src/core/rulesets/halfCasterOfficialProgression.test.ts `
  src/core/rulesets/clericDruidOfficialProgression.test.ts `
  src/core/rulesets/bardSorcererOfficialProgression.test.ts `
  src/core/rulesets/warlockWizardOfficialProgression.test.ts `
  src/core/rulesets/subclassOfficialProgressionFixes.test.ts `
  src/features/characters/levelUpCalculator.test.ts `
  src/features/characters/levelUpHistory.test.ts
if ($LASTEXITCODE -ne 0) { throw "N-MEGA5 regression tests failed" }

Write-Host "N-MEGA5 HOTFIX1: production build calistiriliyor..."
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "N-MEGA5 build failed" }

Write-Host "N-MEGA5 HOTFIX1 GREEN"
