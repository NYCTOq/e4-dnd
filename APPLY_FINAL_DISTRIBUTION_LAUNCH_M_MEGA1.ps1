param(
  [string]$BaseUrl = "",
  [switch]$SkipGitHubRelease
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "E4 D&D M-MEGA1 Final Distribution and Launch Closure starting..." -ForegroundColor Cyan

Write-Host ""
Write-Host "[1/7] Verify Git state and public tag" -ForegroundColor Yellow
$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0) { throw "git status failed." }

$allowedLaunchFiles = @(
  "APPLY_FINAL_DISTRIBUTION_LAUNCH_M_MEGA1.ps1",
  "PUBLISH_GITHUB_RELEASE_M_MEGA1.ps1",
  "PREPARE_HOSTING_PACKAGES_M_MEGA1.ps1",
  "RUN_LIVE_SMOKE_M_MEGA1.ps1",
  "RECORD_DEVICE_ACCEPTANCE_M_MEGA1.ps1",
  "README_FINAL_DISTRIBUTION_LAUNCH_M_MEGA1.md",
  "release/STAGING_ROLLBACK_REHEARSAL_M_MEGA1.md",
  "APPLY_LAUNCH_SELF_DIRTY_GIT_CHECK_REPAIR_M_MEGA1A.ps1",
  "README_LAUNCH_SELF_DIRTY_GIT_CHECK_REPAIR_M_MEGA1A.md",
  "scripts/repair-launch-self-dirty-git-check-M-MEGA1A.mjs",
  "APPLY_LAUNCH_PATH_NORMALIZATION_REPAIR_M_MEGA1B.ps1",
  "README_LAUNCH_PATH_NORMALIZATION_REPAIR_M_MEGA1B.md",
  "scripts/repair-launch-path-normalization-M-MEGA1B.mjs",
  "APPLY_LAUNCH_ALLOWED_PATH_REPAIR_M_MEGA1C.ps1",
  "README_LAUNCH_ALLOWED_PATH_REPAIR_M_MEGA1C.md",
  "scripts/repair-launch-allowed-path-M-MEGA1C.mjs"
)

$unexpectedDirty = @()

foreach ($line in $dirty) {
  if (-not $line) { continue }

  $path = $line.Substring(3).Trim()
  $path = ($path.Trim('"') -replace '\\', '/')

  $isAllowed = $false

  foreach ($allowed in $allowedLaunchFiles) {
    $allowedNormalized = ($allowed -replace '\\', '/')
    if ($path -eq $allowedNormalized) {
      $isAllowed = $true
      break
    }
  }

  if (-not $isAllowed) {
    $unexpectedDirty += $line
  }
}

if ($unexpectedDirty.Count -gt 0) {
  Write-Host "Beklenmeyen Git degisiklikleri:" -ForegroundColor Red
  $unexpectedDirty | ForEach-Object { Write-Host "  $_" }
  throw "Working tree icinde launch paketi disinda commit edilmemis degisiklik var."
}

if ($dirty.Count -gt 0) {
  Write-Host "Yalnizca M-MEGA1 launch dosyalari untracked/modified; devam ediliyor." -ForegroundColor DarkYellow
}

git rev-parse --verify "refs/tags/v6.2.0" *> $null
if ($LASTEXITCODE -ne 0) { throw "Local v6.2.0 tag missing." }

git ls-remote --exit-code --tags origin "refs/tags/v6.2.0" *> $null
if ($LASTEXITCODE -ne 0) { throw "Remote v6.2.0 tag missing." }

Write-Host ""
Write-Host "[2/7] Verify public package hash" -ForegroundColor Yellow
node ".\scripts\verify-public-package-K-MEGA2.mjs"
if ($LASTEXITCODE -ne 0) { throw "Public package verification failed." }

Write-Host ""
Write-Host "[3/7] Prepare Apache and Nginx upload packages" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File ".\PREPARE_HOSTING_PACKAGES_M_MEGA1.ps1"
if ($LASTEXITCODE -ne 0) { throw "Hosting package preparation failed." }

Write-Host ""
Write-Host "[4/7] Publish or refresh GitHub Release" -ForegroundColor Yellow
if (-not $SkipGitHubRelease) {
  if (Get-Command gh -ErrorAction SilentlyContinue) {
    powershell -ExecutionPolicy Bypass -File ".\PUBLISH_GITHUB_RELEASE_M_MEGA1.ps1"
    if ($LASTEXITCODE -ne 0) { throw "GitHub Release publishing failed." }
  } else {
    Write-Host "GitHub CLI bulunamadi; GitHub Release adimi atlandi." -ForegroundColor DarkYellow
    Write-Host "Kurulum: winget install --id GitHub.cli"
  }
} else {
  Write-Host "GitHub Release kullanici istegiyle atlandi." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "[5/7] Run final release regression" -ForegroundColor Yellow
npx.cmd vitest run `
  src/certification/player-readiness/finalPublicRelease-K-MEGA1.test.ts `
  src/certification/player-readiness/publicReleasePackagingPostRelease-K-MEGA2.test.ts `
  src/certification/player-readiness/launchHandoffHostingDeviceAcceptance-L-MEGA1.test.ts `
  src/core/release/finalReleaseGate.test.ts `
  src/core/release/postReleaseQa.test.ts
if ($LASTEXITCODE -ne 0) { throw "Final release regression failed." }

Write-Host ""
Write-Host "[6/7] Optional live smoke" -ForegroundColor Yellow
if ($BaseUrl) {
  powershell -ExecutionPolicy Bypass -File ".\RUN_LIVE_SMOKE_M_MEGA1.ps1" -BaseUrl $BaseUrl
  if ($LASTEXITCODE -ne 0) { throw "Live smoke failed." }
} else {
  Write-Host "BaseUrl verilmedi. Canli test daha sonra su komutla calistirilacak:" -ForegroundColor DarkYellow
  Write-Host 'powershell -ExecutionPolicy Bypass -File .\RUN_LIVE_SMOKE_M_MEGA1.ps1 -BaseUrl "https://site-adresi.com"'
}

Write-Host ""
Write-Host "[7/7] Final handoff summary" -ForegroundColor Yellow
@"
E4 D&D 6.2.0 FINAL DISTRIBUTION

Git:
- main pushed
- v6.2.0 pushed

Release:
- release\E4_DND_6.2.0_PUBLIC.zip
- release\E4_DND_6.2.0_PUBLIC.sha256

Hosting:
- release\E4_DND_6.2.0_APACHE_UPLOAD.zip
- release\E4_DND_6.2.0_NGINX_UPLOAD.zip

Remaining manual evidence:
- live URL smoke if BaseUrl was not supplied
- physical device acceptance
- staging rollback rehearsal
"@ | Set-Content ".\release\FINAL_DISTRIBUTION_HANDOFF_M_MEGA1.txt" -Encoding utf8

Write-Host ""
Write-Host "M-MEGA1 GREEN - Git verification, hosting packages, release packaging and launch handoff passed." -ForegroundColor Green
