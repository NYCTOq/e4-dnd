$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.140 Test & Repository Cleanup starting..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$required = @(
  "scripts\repository-cleanup-v5.140.mjs",
  "scripts\install-test-repository-cleanup-v5.140.mjs",
  "src\release\repositoryCleanupPolicy.ts",
  "src\release\repositoryCleanupPolicy-v5.140.test.ts"
)
foreach ($file in $required) { if (-not (Test-Path $file)) { throw "Missing v5.140 file: $file" } }
node .\scripts\install-test-repository-cleanup-v5.140.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.140 package script installation failed." }
npm.cmd run certify:test-repository-cleanup
if ($LASTEXITCODE -ne 0) { throw "v5.140 Test & Repository Cleanup certification failed." }
Write-Host "v5.140 GREEN - Test & Repository Cleanup closed; next target: Dependency & Security Hardening v5.141."
