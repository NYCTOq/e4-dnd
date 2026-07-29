$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D4 Narrative Guidance Wave 3 starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/7] Full narrative feature routing matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/narrativeGuidanceWave3-v6.2D4.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D4 RED - narrative guidance matrix has blockers." -ForegroundColor Red
  Write-Host "Read reports\NARRATIVE_GUIDANCE_WAVE3_v6.2D4.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/7] Builder guidance and choice suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/builder/builderGuidance.test.ts `
  src/core/rulesets/unifiedCharacterChoices.test.ts `
  src/core/rulesets/choiceDebt.test.ts `
  src/core/rulesets/levelOneFeatureChoiceReadiness.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Builder guidance or choice certification failed."
}

Write-Host ""
Write-Host "[3/7] Exploration and social readiness suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/rulesets/levelOneSocialReadiness.test.ts `
  src/core/rulesets/levelOneAncestryReadiness.test.ts `
  src/core/rulesets/levelOneOriginReadiness.test.ts `
  src/core/rulesets/levelOneProficiencyReadiness.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Exploration or social readiness certification failed."
}

Write-Host ""
Write-Host "[4/7] Downtime, quest and world-state suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/downtime/campaignCalendarStorage.test.ts `
  src/features/quests/questJournalStorage.test.ts `
  src/features/locations/locationAtlasStorage.test.ts `
  src/features/factions/factionStorage.test.ts `
  src/features/npc-manager/npcManagerStorage.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Downtime or world-state certification failed."
}

Write-Host ""
Write-Host "[5/7] Search, guidance and manual-runtime suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/search/globalSearch.test.ts `
  src/core/runtime/manualRuntimeBridge-v5.135.test.ts `
  src/core/session/sessionPlayLoop-v5.134.test.ts `
  src/core/character/playActionHistory.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Narrative guidance or manual-runtime certification failed."
}

Write-Host ""
Write-Host "[6/7] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[7/7] Production build" -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Production build failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\NARRATIVE_GUIDANCE_WAVE3_v6.2D4.json"
Write-Host "  reports\NARRATIVE_GUIDANCE_WAVE3_v6.2D4.md"
Write-Host ""
Write-Host "v6.2D4 GREEN - Every subclass feature has narrative guidance or an explicit table-ruling contract." -ForegroundColor Green
