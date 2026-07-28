$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "E4 D&D v5.124 Play Feedback, Recovery & Undo Mega starting..."
$required = @(
  "src\core\character\playActionHistory.ts",
  "src\features\play-mode\PlayMode.tsx",
  "e2e\play-feedback-undo-v5.124.spec.ts",
  "package.json"
)
foreach ($file in $required) { if (-not (Test-Path (Join-Path $root $file))) { throw "Missing package file: $file" } }
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.124 npm install failed." }
npx.cmd playwright install chromium
if ($LASTEXITCODE -ne 0) { throw "v5.124 Chromium install failed." }
npm.cmd run certify:play-feedback
if ($LASTEXITCODE -ne 0) { throw "v5.124 play feedback closure failed." }
Write-Host "v5.124 GREEN - Play Feedback, Recovery & Undo closed; next target: Builder Guidance & Draft Recovery Mega v5.125." -ForegroundColor Green
