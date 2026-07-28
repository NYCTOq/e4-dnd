$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "E4 D&D v5.127D3 Accessibility Test Isolation Hotfix starting..."

$required = @(
  "src/shared/layout/AppFrame.tsx",
  "src/styles/21-accessibility.css",
  "e2e/accessibility-essentials-v5.127.spec.ts",
  "package.json"
)
foreach ($file in $required) {
  if (-not (Test-Path (Join-Path $root $file))) { throw "Missing required file: $file" }
}

npm.cmd run certify:accessibility-essentials
if ($LASTEXITCODE -ne 0) { throw "v5.127D3 Accessibility Essentials certification failed." }

Write-Host "v5.127D3 GREEN - Accessibility Essentials closed; next target: Release Hardening Mega v5.128."
