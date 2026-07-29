$ErrorActionPreference = "Stop"
Write-Host "E4 D&D G-MEGA2 Production Deployment and Golden Release Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
New-Item -ItemType Directory -Path ".\release" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Golden release manifest certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "G-MEGA2 RED - golden release manifest has blockers." -ForegroundColor Red
  Write-Host "Read reports\PRODUCTION_GOLDEN_RELEASE_G_MEGA2.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/10] Full E/F/G mega regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/fullInteractivePlayerJourney-E-MEGA1.test.ts `
  src/certification/player-readiness/combatSpellAutomation-E-MEGA2.test.ts `
  src/certification/player-readiness/contentAccuracyRulesetDifferential-F-MEGA1.test.ts `
  src/certification/player-readiness/contentExpansionCatalogClosure-F-MEGA2.test.ts `
  src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) { throw "Mega regression failed." }

Write-Host ""
Write-Host "[3/10] Release, packaging and rollback gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts `
  src/core/release/releasePackaging-v5.144.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/features/backup/backupRecovery.test.ts
if ($LASTEXITCODE -ne 0) { throw "Release, packaging or rollback gate failed." }

Write-Host ""
Write-Host "[4/10] Distribution, offline and performance gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts `
  src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts `
  src/core/performance/bundlePerformanceBudget-v5.142.test.ts `
  src/core/rulesets/rulesetLoaderChunks.test.ts `
  src/core/qa/mobileAccessibilityPerformance.test.ts
if ($LASTEXITCODE -ne 0) { throw "Distribution, offline or performance gate failed." }

Write-Host ""
Write-Host "[5/10] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[6/10] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Clean production build failed." }

if (-not (Test-Path ".\dist\index.html")) {
  throw "dist\index.html missing."
}

if (-not (Test-Path ".\dist\manifest.webmanifest")) {
  throw "dist\manifest.webmanifest missing."
}

if (-not (Test-Path ".\dist\sw.js")) {
  throw "dist\sw.js missing."
}

Write-Host ""
Write-Host "[7/10] Generate asset manifest and SHA-256 checksums" -ForegroundColor Yellow
node ".\scripts\generate-golden-release-manifest-G-MEGA2.mjs"
if ($LASTEXITCODE -ne 0) { throw "Golden release asset manifest generation failed." }

if (-not (Test-Path ".\release\GOLDEN_RELEASE_ASSET_MANIFEST_G_MEGA2.json")) {
  throw "Golden release asset manifest missing."
}

Write-Host ""
Write-Host "[8/10] Desktop and mobile production smoke" -ForegroundColor Yellow
npx.cmd playwright test e2e/production-golden-release-G-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Production browser smoke failed." }

Write-Host ""
Write-Host "[9/10] Post-build release regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts `
  src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/postReleaseQa.test.ts
if ($LASTEXITCODE -ne 0) { throw "Post-build release regression failed." }

Write-Host ""
Write-Host "[10/10] Final dist and release artifact inspection" -ForegroundColor Yellow
$distFiles = Get-ChildItem ".\dist" -Recurse -File
if ($distFiles.Count -lt 3) {
  throw "Production dist contains too few files."
}

$assetManifest = Get-Content ".\release\GOLDEN_RELEASE_ASSET_MANIFEST_G_MEGA2.json" -Raw | ConvertFrom-Json
if ($assetManifest.fileCount -ne $distFiles.Count) {
  throw "Golden asset manifest file count does not match dist."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\PRODUCTION_GOLDEN_RELEASE_G_MEGA2.json"
Write-Host "  reports\PRODUCTION_GOLDEN_RELEASE_G_MEGA2.md"
Write-Host "  release\GOLDEN_RELEASE_ASSET_MANIFEST_G_MEGA2.json"
Write-Host "  release\GOLDEN_RELEASE_CHECKLIST_G_MEGA2.md"
Write-Host ""
Write-Host "G-MEGA2 GREEN - Production deployment, checksums, browser smoke, rollback and golden release gates passed." -ForegroundColor Green
