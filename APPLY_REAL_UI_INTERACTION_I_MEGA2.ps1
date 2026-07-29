$ErrorActionPreference = "Stop"
Write-Host "E4 D&D I-MEGA2 Real UI Interaction Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
New-Item -ItemType Directory -Path ".\release" -Force | Out-Null

Write-Host ""
Write-Host "[1/11] Real UI interaction manifest" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/realUiInteractionClosure-I-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "I-MEGA2 RED - interaction manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\REAL_UI_INTERACTION_CLOSURE_I_MEGA2.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/11] Builder and character choices" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/builder/builderGuidance.test.ts `
  src/core/rulesets/unifiedCharacterChoices.test.ts `
  src/core/rulesets/fullCharacterCertification.integration.test.ts `
  src/certification/player-readiness/playerChoiceIntegrityMatrix-v6.2C2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Builder or character choice interaction failed." }

Write-Host ""
Write-Host "[3/11] Spell, feat and equipment choices" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/builderSpellIntegration.test.ts `
  src/core/rulesets/featOfficialCertification.test.ts `
  src/core/rulesets/itemUseRules.test.ts `
  src/core/rulesets/itemEffectRuntimeRules.test.ts
if ($LASTEXITCODE -ne 0) { throw "Spell, feat or equipment interaction failed." }

Write-Host ""
Write-Host "[4/11] Character Sheet and Play Mode" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/character/sheetPlayModeConsistency.test.ts `
  src/core/character/playReadiness.test.ts `
  src/certification/integration/characterHubActionabilityContract.test.ts `
  src/certification/player-readiness/finalPlayableRuntimeClosure-v6.2D6.test.ts
if ($LASTEXITCODE -ne 0) { throw "Character Sheet or Play Mode interaction failed." }

Write-Host ""
Write-Host "[5/11] Combat, spell, rest and death" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts `
  src/features/rest/restAutomation.test.ts `
  src/features/rest/restSheetPlayIntegration.test.ts `
  src/certification/integration/deathDyingPlayModeIntegration.test.ts
if ($LASTEXITCODE -ne 0) { throw "Combat, rest or death interaction failed." }

Write-Host ""
Write-Host "[6/11] Level-up and persistence" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/oracle/levelUpProgressionOracle.test.ts `
  src/certification/integration/levelUpPersistenceBridge.test.ts `
  src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) { throw "Level-up or persistence interaction failed." }

Write-Host ""
Write-Host "[7/11] Backup, transfer and reload" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) { throw "Backup, transfer or reload interaction failed." }

Write-Host ""
Write-Host "[8/11] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[9/11] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

if (-not (Test-Path ".\dist\index.html")) { throw "dist\index.html missing." }
if (-not (Test-Path ".\dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing." }
if (-not (Test-Path ".\dist\sw.js")) { throw "dist\sw.js missing." }

Write-Host ""
Write-Host "[10/11] Desktop, tablet and mobile real interaction matrix" -ForegroundColor Yellow
npx.cmd playwright test e2e/real-ui-interaction-I-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Real UI interaction browser matrix failed." }

Write-Host ""
Write-Host "[11/11] Interaction snapshot and final regression" -ForegroundColor Yellow
node ".\scripts\generate-real-ui-interaction-snapshot-I-MEGA2.mjs"
if ($LASTEXITCODE -ne 0) { throw "Interaction snapshot generation failed." }

npx.cmd vitest run `
  src/certification/player-readiness/realUiInteractionClosure-I-MEGA2.test.ts `
  src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final interaction regression failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\REAL_UI_INTERACTION_CLOSURE_I_MEGA2.json"
Write-Host "  reports\REAL_UI_INTERACTION_CLOSURE_I_MEGA2.md"
Write-Host "  release\REAL_UI_INTERACTION_SNAPSHOT_I_MEGA2.json"
Write-Host "  release\REAL_UI_INTERACTION_CHECKLIST_I_MEGA2.md"
Write-Host ""
Write-Host "I-MEGA2 GREEN - Builder, choices, sheet, Play Mode, combat, rest, level-up, backup and device interaction passed." -ForegroundColor Green
