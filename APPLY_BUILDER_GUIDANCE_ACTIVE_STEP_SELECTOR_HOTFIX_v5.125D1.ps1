$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "E4 D&D v5.125D1 Builder Guidance Active Step Selector Hotfix starting..."
$required = @("package.json", "e2e\builder-guidance-recovery-v5.125.spec.ts")
foreach ($file in $required) { if (-not (Test-Path (Join-Path $root $file))) { throw "Missing package file: $file" } }
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.125D1 npm install failed." }
npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.125D1 Chromium install failed." }
npm.cmd run certify:builder-guidance
if ($LASTEXITCODE -ne 0) { throw "v5.125D1 Builder Guidance certification failed." }
Write-Host "v5.125D1 GREEN - Builder Guidance & Draft Recovery closed; next target: Error, Offline & Backup Recovery Mega v5.126."
