$ErrorActionPreference = "Stop"
Write-Host "E4 D&D K-MEGA2 Public Release Packaging and Post-Release Baseline starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found."
}

New-Item -ItemType Directory -Path ".\release" -Force | Out-Null

Write-Host ""
Write-Host "[1/10] Public release packaging certification" -ForegroundColor Yellow
npx.cmd vitest run src/certification/player-readiness/publicReleasePackagingPostRelease-K-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Public release packaging certification failed." }

Write-Host ""
Write-Host "[2/10] Final public release and deployment regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/finalPublicRelease-K-MEGA1.test.ts `
  src/certification/player-readiness/deploymentPackageRollback-J-MEGA2.test.ts `
  src/certification/player-readiness/finalUserAcceptance-I-MEGA1.test.ts `
  src/certification/player-readiness/realUiInteractionClosure-I-MEGA2.test.ts
if ($LASTEXITCODE -ne 0) { throw "Public release or deployment regression failed." }

Write-Host ""
Write-Host "[3/10] Recovery, migration and post-release QA" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/saveMigrationVersioningRelease-G-MEGA1.test.ts `
  src/certification/player-readiness/supportRecoveryMaintenance-H-MEGA2.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/features/backup/backupRecovery.test.ts
if ($LASTEXITCODE -ne 0) { throw "Recovery, migration or post-release QA failed." }

Write-Host ""
Write-Host "[4/10] Full unit and integration suite" -ForegroundColor Yellow
npm.cmd run test
if ($LASTEXITCODE -ne 0) { throw "Full unit suite failed." }

Write-Host ""
Write-Host "[5/10] Clean public production build" -ForegroundColor Yellow
if (Test-Path ".\dist") {
  Remove-Item ".\dist" -Recurse -Force
}

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed." }

if (-not (Test-Path ".\dist\index.html")) { throw "dist\index.html missing." }
if (-not (Test-Path ".\dist\manifest.webmanifest")) { throw "dist\manifest.webmanifest missing." }
if (-not (Test-Path ".\dist\sw.js")) { throw "dist\sw.js missing." }

Write-Host ""
Write-Host "[6/10] Refresh public deployment archive" -ForegroundColor Yellow
node ".\scripts\generate-public-release-archive-K-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Public deployment archive refresh failed." }

node ".\scripts\verify-public-release-archive-K-MEGA1.mjs"
if ($LASTEXITCODE -ne 0) { throw "Public deployment archive verification failed." }

Write-Host ""
Write-Host "[7/10] Generate post-release baseline" -ForegroundColor Yellow
node ".\scripts\generate-post-release-baseline-K-MEGA2.mjs"
if ($LASTEXITCODE -ne 0) { throw "Post-release baseline generation failed." }

Write-Host ""
Write-Host "[8/10] Build public distribution ZIP and SHA-256" -ForegroundColor Yellow
$deploymentPath = ".\deployment\e4-dnd-6.2.0-public"
$zipPath = ".\release\E4_DND_6.2.0_PUBLIC.zip"
$hashPath = ".\release\E4_DND_6.2.0_PUBLIC.sha256"

if (-not (Test-Path $deploymentPath)) {
  throw "Public deployment folder missing."
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

Compress-Archive -Path "$deploymentPath\*" -DestinationPath $zipPath -CompressionLevel Optimal

$hash = (Get-FileHash $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  E4_DND_6.2.0_PUBLIC.zip" | Set-Content -Path $hashPath -Encoding utf8

Write-Host ""
Write-Host "[9/10] Verify public package and final browser smoke" -ForegroundColor Yellow
node ".\scripts\verify-public-package-K-MEGA2.mjs"
if ($LASTEXITCODE -ne 0) { throw "Public package verification failed." }

npx.cmd playwright test `
  e2e/final-user-acceptance-I-MEGA1.spec.ts `
  e2e/real-ui-interaction-I-MEGA2.spec.ts `
  e2e/production-golden-release-G-MEGA2.spec.ts
if ($LASTEXITCODE -ne 0) { throw "Final public browser smoke failed." }

Write-Host ""
Write-Host "[10/10] Final post-release and quality gates" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/publicReleasePackagingPostRelease-K-MEGA2.test.ts `
  src/certification/player-readiness/finalPublicRelease-K-MEGA1.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/postReleaseQa.test.ts `
  src/core/quality/releaseReadinessAudit.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final post-release quality gate failed." }

Write-Host ""
Write-Host "Generated:" -ForegroundColor Green
Write-Host "  release\E4_DND_6.2.0_PUBLIC.zip"
Write-Host "  release\E4_DND_6.2.0_PUBLIC.sha256"
Write-Host "  release\POST_RELEASE_BASELINE_K_MEGA2.json"
Write-Host "  release\POST_RELEASE_BASELINE_K_MEGA2.md"
Write-Host "  release\HOTFIX_CHANNEL_RUNBOOK_K_MEGA2.md"
Write-Host ""
Write-Host "K-MEGA2 GREEN - Public ZIP, SHA-256, post-release baseline, hotfix channel and final quality gates passed." -ForegroundColor Green
