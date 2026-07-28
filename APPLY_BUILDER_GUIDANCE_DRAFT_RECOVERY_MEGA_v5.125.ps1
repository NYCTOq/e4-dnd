$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "E4 D&D v5.125 Builder Guidance & Draft Recovery Mega starting..."
$required = @("package.json", "src\features\builder\Builder.tsx", "src\features\builder\builderGuidance.ts", "e2e\builder-guidance-recovery-v5.125.spec.ts")
foreach ($file in $required) { if (-not (Test-Path (Join-Path $root $file))) { throw "Missing package file: $file" } }
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.125 npm install failed." }
npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.125 Chromium install failed." }
npm.cmd run certify:builder-guidance
if ($LASTEXITCODE -ne 0) { throw "v5.125 Builder Guidance certification failed." }
Write-Host "v5.125 GREEN - Builder Guidance & Draft Recovery closed; next target: Error, Offline & Backup Recovery Mega v5.126."
