$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.141D2 React Router Secure Upgrade starting..."

if (-not (Test-Path ".\package.json")) { throw "Run this script from the project root." }

$backupDir = ".\reports\dependency-backup-v5.141D2"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item ".\package.json" "$backupDir\package.json.before" -Force
if (Test-Path ".\package-lock.json") { Copy-Item ".\package-lock.json" "$backupDir\package-lock.json.before" -Force }

node ".\scripts\apply-react-router-secure-upgrade-v5.141D2.mjs"
if ($LASTEXITCODE -ne 0) { throw "v5.141D2 package update failed." }

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.141D2 npm install failed." }

Write-Host "Production audit after React Router 7.18.1 upgrade..."
npm.cmd audit --omit=dev --audit-level=high
if ($LASTEXITCODE -ne 0) {
  throw "v5.141D2 production audit still contains high/critical vulnerabilities. Do not use --force."
}

npm.cmd run test:critical
if ($LASTEXITCODE -ne 0) { throw "v5.141D2 critical tests failed." }

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "v5.141D2 production build failed." }

$report = @"
# React Router Secure Upgrade v5.141D2

- react-router-dom upgraded and pinned to 7.18.1.
- Direct react-router dependency, when present, pinned to 7.18.1.
- vite-plugin-pwa remains in devDependencies because it is a build-time tool.
- npm audit --omit=dev --audit-level=high passed.
- Critical tests passed.
- Production build passed.
- npm audit fix --force was not used.
"@
New-Item -ItemType Directory -Force -Path ".\reports" | Out-Null
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "reports\REACT_ROUTER_SECURE_UPGRADE_v5.141D2.md"), $report, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "v5.141D2 GREEN - Dependency & Security Hardening closed; next target: Performance & Bundle Optimization v5.142."
