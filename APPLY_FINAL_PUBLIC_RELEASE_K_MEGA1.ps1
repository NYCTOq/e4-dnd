$ErrorActionPreference = "Stop"
Write-Host "E4 D&D K-MEGA1 Final Public Release Certification starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) { throw "package.json not found." }

New-Item -ItemType Directory -Path ".\release" -Force | Out-Null
New-Item -ItemType Directory -Path ".\deployment" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Promote 6.2.0 RC to public release" -ForegroundColor Yellow
node ".\scripts\finalize-public-release-K-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Public release promotion failed." }

Write-Host ""
Write-Host "[2/10] Public release metadata certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/finalPublicRelease-K-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) { throw "Public release metadata certification failed." }

Write-Host ""
Write-Host "[3/10] RC, deployment and acceptance regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/versionBumpReleaseCandidate-J-MEGA1.test.ts `
  src/certification/player-readiness/deploymentPackageRollback-J-MEGA2.test.ts `
  src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts `
  src/certification/player-readiness/realUiInteractionClosure-I-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "RC, deployment or acceptance regression failed." }

Write-Host ""
Write-Host "[4/10] Operations, recovery and migration regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts `
  src/certification/player-readiness/productionOperationsDiagnostics-H-MEGA1.test.ts `
  src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Operations, recovery or migration regression failed." }

Write-Host ""
Write-Host "[5/10] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[6/10] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

if (-not (Test-Path ".\dist\index.html")) { throw "dist\index.html missing." }
if (-not (Test-Path ".\dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing." }
if (-not (Test-Path ".\dist\sw.js")) { throw "dist\sw.js missing." }

Write-Host ""
Write-Host "[7/10] Final public browser acceptance" -ForegroundColor Yellow
npx.cmd playwright test `
  e2e/final-user-acceptance-I-MEGA1.spec.ts `
  e2e/real-ui-interaction-I-MEGA2.spec.ts `
  e2e/production-golden-release-G-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Final public browser acceptance failed." }

Write-Host ""
Write-Host "[8/10] Generate public deployment archive" -ForegroundColor Yellow
node ".\scripts\generate-public-release-archive-K-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Public release archive generation failed." }

Write-Host ""
Write-Host "[9/10] Verify public deployment archive" -ForegroundColor Yellow
node ".\scripts\verify-public-release-archive-K-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Public release archive verification failed." }

Write-Host ""
Write-Host "[10/10] Final public release gate" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/finalPublicRelease-K-MEGA1.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final public release gate failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  deployment\e4-dnd-6.2.0-public\"
Write-Host "  release\PUBLIC_RELEASE_METADATA_K_MEGA1.json"
Write-Host "  release\PUBLIC_RELEASE_ARCHIVE_K_MEGA1.json"
Write-Host "  release\PUBLIC_RELEASE_NOTES_6.2.0.md"
Write-Host "  release\PUBLIC_ROLLBACK_RUNBOOK_K_MEGA1.md"
Write-Host "  release\GITHUB_RELEASE_HANDOFF_K_MEGA1.md"
Write-Host ""
Write-Host "K-MEGA1 GREEN - E4 D&D 6.2.0 public release, archive, checksums, rollback and final certification passed." -ForegroundColor Green
