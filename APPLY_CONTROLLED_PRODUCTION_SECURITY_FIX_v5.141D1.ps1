$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.141D1 Controlled Production Security Fix starting..."

if (-not (Test-Path ".\package.json")) { throw "Run this script from the project root." }

$backupDir = ".\reports\dependency-backup-v5.141D1"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item ".\package.json" "$backupDir\package.json.before" -Force
if (Test-Path ".\package-lock.json") { Copy-Item ".\package-lock.json" "$backupDir\package-lock.json.before" -Force }

node ".\scripts\apply-controlled-production-security-fix-v5.141D1.mjs"
if ($LASTEXITCODE -ne 0) { throw "v5.141D1 package update failed." }

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.141D1 npm install failed." }

Write-Host "Production audit after controlled dependency changes..."
npm.cmd audit --omit=dev
if ($LASTEXITCODE -ne 0) {
  throw "v5.141D1 production audit still contains high/critical vulnerabilities. Do not use --force."
}

npm.cmd run test:critical
if ($LASTEXITCODE -ne 0) { throw "v5.141D1 critical tests failed." }

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "v5.141D1 production build failed." }

$report = @"
# Controlled Production Security Fix v5.141D1

- react-router-dom pinned to 7.11.0, below the RSC-only advisory range beginning at 7.12.0.
- Direct react-router dependency, when present, pinned to 7.11.0.
- vite-plugin-pwa moved from dependencies to devDependencies because it runs during build.
- npm audit --omit=dev passed.
- Critical tests passed.
- Production build passed.
- npm audit fix --force was not used.
"@
New-Item -ItemType Directory -Force -Path ".\reports" | Out-Null
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "reports\CONTROLLED_PRODUCTION_SECURITY_FIX_v5.141D1.md"), $report, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "v5.141D1 GREEN - Production security gate closed; next target: Performance & Bundle Optimization v5.142."
