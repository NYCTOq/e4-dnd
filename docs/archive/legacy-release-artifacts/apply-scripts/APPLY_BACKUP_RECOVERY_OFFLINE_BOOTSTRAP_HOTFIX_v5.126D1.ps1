$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "E4 D&D v5.126D1 Backup Recovery Offline Bootstrap Hotfix starting..."

$required = @(
  "e2e\error-offline-backup-recovery-v5.126.spec.ts",
  "package.json"
)
foreach ($file in $required) {
  if (-not (Test-Path (Join-Path $root $file))) { throw "v5.126D1 required file missing: $file" }
}

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.126D1 npm install failed." }

npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.126D1 Chromium install failed." }

npm.cmd run certify:backup-recovery
if ($LASTEXITCODE -ne 0) { throw "v5.126D1 Backup Recovery certification failed." }

Write-Host "v5.126D1 GREEN - Error, Offline & Backup Recovery closed; next target: Accessibility Essentials Mega v5.127."
