$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.135 Playable Gap Closure Mega starting..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @(
  "src\core\runtime\manualRuntimeBridge.ts",
  "src\core\runtime\manualRuntimeBridge-v5.135.test.ts",
  "src\features\play-mode\PlayMode.tsx",
  "src\styles\42-playable-gap-closure.css",
  "src\index.css",
  "package.json"
)
foreach ($relative in $files) {
  $source = Join-Path $root $relative
  $target = Join-Path (Get-Location) $relative
  if (-not (Test-Path $source)) { throw "Missing package file: $relative" }
  $targetDir = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  Copy-Item -Force $source $target
}
Write-Host "v5.135 files applied."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.135 dependency verification failed." }
npm.cmd run certify:playable-gap-closure
if ($LASTEXITCODE -ne 0) { throw "v5.135 Playable Gap Closure certification failed." }
Write-Host "v5.135 GREEN - Playable Gap Closure closed; next target: Full Regression & Release Candidate v5.136."
