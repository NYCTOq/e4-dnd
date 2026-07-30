$ErrorActionPreference = "Stop"
Write-Host "E4 D&D L-MEGA1 Launch Handoff and Device Acceptance Closure starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

Write-Host ""
Write-Host "[1/9] Launch handoff artifact certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/launchHandoffHostingDeviceAcceptance-L-MEGA1.test.ts
if ($LASTEXITCODE -ne 0) { throw "Launch handoff artifact certification failed." }

Write-Host ""
Write-Host "[2/9] Public release and package regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/finalPublicRelease-K-MEGA1.test.ts `
  src/certification/player-readiness/publicReleasePackagingPostRelease-K-MEGA2.test.ts `
  src/certification/player-readiness/deploymentPackageRollback-J-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Public release package regression failed." }

Write-Host ""
Write-Host "[3/9] User acceptance and interaction regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts `
  src/certification/player-readiness/realUiInteractionClosure-I-MEGA2.test.ts `
  src/certification/player-readiness/productionGoldenRelease-G-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Acceptance or interaction regression failed." }

Write-Host ""
Write-Host "[4/9] Recovery and post-release QA" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/features/backup/backupRecovery.test.ts
if ($LASTEXITCODE -ne 0) { throw "Recovery or post-release QA failed." }

Write-Host ""
Write-Host "[5/9] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[6/9] Clean production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

Write-Host ""
Write-Host "[7/9] Final browser and PWA acceptance" -ForegroundColor Yellow
npx.cmd playwright test `
  e2e/final-user-acceptance-I-MEGA1.spec.ts `
  e2e/real-ui-interaction-I-MEGA2.spec.ts `
  e2e/production-golden-release-G-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Final browser acceptance failed." }

Write-Host ""
Write-Host "[8/9] Generate launch evidence and verify public ZIP" -ForegroundColor Yellow
node ".\scripts\generate-launch-evidence-L-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Launch evidence generation failed." }

Write-Host ""
Write-Host "[9/9] Final launch and quality gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/launchHandoffHostingDeviceAcceptance-L-MEGA1.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final launch quality gate failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  release\LAUNCH_EVIDENCE_L_MEGA1.json"
Write-Host "  release\LAUNCH_HANDOFF_L_MEGA1.md"
Write-Host "  release\PHYSICAL_DEVICE_ACCEPTANCE_L_MEGA1.md"
Write-Host "  release\LIVE_HOSTING_SMOKE_L_MEGA1.md"
Write-Host "  deployment\hosting-examples\"
Write-Host ""
Write-Host "L-MEGA1 GREEN - Launch handoff, hosting examples, public ZIP verification and device acceptance preparation passed." -ForegroundColor Green
