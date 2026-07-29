$ErrorActionPreference = "Stop"
Write-Host "E4 D&D J-MEGA1 Version Bump and Release Candidate Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null
New-Item -ItemType Directory -Path ".\release" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Apply 6.2.0 release-candidate metadata" -ForegroundColor Yellow
node ".\scripts\apply-version-bump-release-candidate-J-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Version bump failed." }

Write-Host ""
Write-Host "[2/10] Version and release metadata certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/versionBumpReleaseCandidate-J-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) { throw "Release metadata certification failed." }

Write-Host ""
Write-Host "[3/10] Final acceptance and real UI regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts `
  src/certification/player-readiness/realUiInteractionClosure-I-MEGA2.test.ts `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Acceptance or golden-release regression failed." }

Write-Host ""
Write-Host "[4/10] Operations, maintenance and migration regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts `
  src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts `
  src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Operations or migration regression failed." }

Write-Host ""
Write-Host "[5/10] Release and quality gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/core/release/stablePlayerRelease.test.ts `
  src/core/release/stableReleaseHardening.test.ts `
  src/core/release/publicReleaseReadiness-v6.test.ts `
  src/core/release/releasePackaging-v5.144.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts `
  src/core/release/finalReleaseGate.test.ts
if ($LASTEXITCODE -ne 0) { throw "Release or quality gate failed." }

Write-Host ""
Write-Host "[6/10] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[7/10] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

if (-not (Test-Path ".\dist\index.html")) { throw "dist\index.html missing." }
if (-not (Test-Path ".\dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing." }
if (-not (Test-Path ".\dist\sw.js")) { throw "dist\sw.js missing." }

Write-Host ""
Write-Host "[8/10] Final browser acceptance matrix" -ForegroundColor Yellow
npx.cmd playwright test `
  e2e/final-user-acceptance-I-MEGA1.spec.ts `
  e2e/real-ui-interaction-I-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Final browser acceptance failed." }

Write-Host ""
Write-Host "[9/10] Generate release-candidate bundle and checksums" -ForegroundColor Yellow
node ".\scripts\generate-release-candidate-bundle-J-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Release-candidate bundle generation failed." }

if (-not (Test-Path ".\release\RELEASE_CANDIDATE_BUNDLE_J_MEGA1.json")) {
  throw "Release-candidate bundle missing."
}

Write-Host ""
Write-Host "[10/10] Final metadata and release gate verification" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/versionBumpReleaseCandidate-J-MEGA1.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/postReleaseQa.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final release-candidate verification failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  release\RELEASE_CANDIDATE_METADATA_J_MEGA1.json"
Write-Host "  release\RELEASE_CANDIDATE_BUNDLE_J_MEGA1.json"
Write-Host "  release\RELEASE_NOTES_6.2.0_RC1.md"
Write-Host "  release\CHANGELOG_6.2.0.md"
Write-Host "  release\GIT_RELEASE_HANDOFF_J_MEGA1.md"
Write-Host ""
Write-Host "J-MEGA1 GREEN - Version 6.2.0 RC1, save schema, checksums, acceptance and Git release handoff passed." -ForegroundColor Green
