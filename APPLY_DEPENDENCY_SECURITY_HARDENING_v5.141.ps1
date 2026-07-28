$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.141 Dependency & Security Hardening starting..."

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) { throw "package.json not found. Extract patch contents into the project root." }
if (-not (Test-Path ".\scripts\dependency-security-hardening-v5.141.mjs")) { throw "v5.141 audit script not found." }

$backupDir = ".\reports\dependency-backup-v5.141"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item ".\package.json" "$backupDir\package.json.before" -Force
if (Test-Path ".\package-lock.json") { Copy-Item ".\package-lock.json" "$backupDir\package-lock.json.before" -Force }

$package = Get-Content ".\package.json" -Raw | ConvertFrom-Json
$package.version = "5.141.0"
if (-not $package.scripts) { $package | Add-Member -NotePropertyName scripts -NotePropertyValue ([pscustomobject]@{}) }
$package.scripts | Add-Member -Force -NotePropertyName "audit:security" -NotePropertyValue "node scripts/dependency-security-hardening-v5.141.mjs"
$package.scripts | Add-Member -Force -NotePropertyName "certify:security-hardening" -NotePropertyValue "npm run audit:security && npm run test:critical && npm run build"
$json = $package | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText((Join-Path $root "package.json"), $json + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Package version updated to 5.141.0 using UTF-8 without BOM."

Write-Host "Refreshing dependencies inside existing semver ranges (no --force, no automatic majors)..."
& npm.cmd install --ignore-scripts=false
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
& npm.cmd update --save=false
if ($LASTEXITCODE -ne 0) { throw "npm update failed; package files are backed up under reports\dependency-backup-v5.141." }

Write-Host "Running security gate, critical tests, and production build..."
& npm.cmd run certify:security-hardening
if ($LASTEXITCODE -ne 0) {
  throw "v5.141 security certification failed. Review reports\DEPENDENCY_SECURITY_HARDENING_v5.141.md. No force upgrade was applied."
}

Write-Host "v5.141 GREEN - Dependency & Security Hardening closed; next target: Performance & Bundle Optimization v5.142."
