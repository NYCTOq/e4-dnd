$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.2D10 Post-Build Offline Install Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

Write-Host ""
Write-Host "[1/9] Post-build source contract matrix" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts
if ($LASTEXITCODE -ne 0) {
  Write-Host "v6.2D10 RED - post-build source contracts have blockers." -ForegroundColor Red
  Write-Host "Read reports\POST_BUILD_OFFLINE_INSTALL_CLOSURE_v6.2D10.md" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/9] Release candidate and distribution regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/releaseCandidateCertification-v6.2D8.test.ts `
  src/certification/player-readiness/publicReleaseDistributionClosure-v6.2D9.test.ts `
  src/core/release/releasePackaging-v5.144.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Release candidate or distribution regression failed."
}

Write-Host ""
Write-Host "[3/9] Navigation and route fallback suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/differential/navigationSearchRouteParity.test.ts `
  src/certification/integration/navigationSearchRouteParityContract.test.ts `
  src/certification/integration/navigationSearchUiFinalClosureContract.test.ts `
  src/features/search/globalSearch.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Navigation or route fallback certification failed."
}

Write-Host ""
Write-Host "[4/9] Backup and install-recovery suites" -ForegroundColor Yellow
npx.cmd vitest run `
  src/features/backup/characterBackup.test.ts `
  src/features/backup/fullBackup.test.ts `
  src/features/backup/backupRecovery.test.ts `
  src/features/characters/characterTransfer.test.ts `
  src/core/storage/characterHydration.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Backup or install recovery certification failed."
}

Write-Host ""
Write-Host "[5/9] Performance and offline-shell support" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/performance/bundlePerformanceBudget-v5.142.test.ts `
  src/core/rulesets/rulesetLoaderChunks.test.ts `
  src/core/qa/mobileAccessibilityPerformance.test.ts `
  src/core/quality/uiMobileAccessibilityPolish.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Offline shell performance certification failed."
}

Write-Host ""
Write-Host "[6/9] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) {
  throw "Full unit suite failed."
}

Write-Host ""
Write-Host "[7/9] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  throw "Clean production build failed."
}

Write-Host ""
Write-Host "[8/9] Generated dist smoke inspection" -ForegroundColor Yellow
if (-not (Test-Path ".\dist\index.html")) {
  throw "dist\index.html missing after build."
}

$assetFiles = Get-ChildItem ".\dist" -Recurse -File |
  Where-Object { $_.Extension -in ".js", ".css" }

if ($assetFiles.Count -eq 0) {
  throw "No compiled JS or CSS assets found in dist."
}

$indexHtml = Get-Content ".\dist\index.html" -Raw
if ($indexHtml -notmatch "<script") {
  throw "dist\index.html contains no script reference."
}

Write-Host ""
Write-Host "[9/9] Re-run post-build matrix against generated dist" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/postBuildOfflineInstallClosure-v6.2D10.test.ts
if ($LASTEXITCODE -ne 0) {
  throw "Generated dist smoke matrix failed."
}

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  reports\POST_BUILD_OFFLINE_INSTALL_CLOSURE_v6.2D10.json"
Write-Host "  reports\POST_BUILD_OFFLINE_INSTALL_CLOSURE_v6.2D10.md"
Write-Host "  dist\index.html"
Write-Host ""
Write-Host "v6.2D10 GREEN - Post-build smoke, offline shell and install recovery passed." -ForegroundColor Green
