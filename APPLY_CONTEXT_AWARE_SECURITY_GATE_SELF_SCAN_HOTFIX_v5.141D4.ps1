$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.141D4 Context-Aware Security Self-Scan Hotfix starting..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$gatePath = Join-Path $root "scripts\context-aware-production-security-gate-v5.141D4.mjs"
if (-not (Test-Path $gatePath)) { throw "D4 security gate file is missing: $gatePath" }

$pkgPath = Join-Path $root "package.json"
$pkg = Get-Content -Raw -Encoding UTF8 $pkgPath | ConvertFrom-Json
$pkg.version = "5.141.4"
if (-not $pkg.scripts) { $pkg | Add-Member -NotePropertyName scripts -NotePropertyValue ([pscustomobject]@{}) }
$pkg.scripts | Add-Member -Force -NotePropertyName "audit:security:context" -NotePropertyValue "node scripts/context-aware-production-security-gate-v5.141D4.mjs"
$pkg.scripts | Add-Member -Force -NotePropertyName "certify:security-hardening" -NotePropertyValue "npm run audit:security:context && npm run test:critical && npm run build"
$json = $pkg | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText($pkgPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Host "package.json updated to 5.141.4; self-scanning security gate replaced."

npm.cmd run certify:security-hardening
if ($LASTEXITCODE -ne 0) { throw "v5.141D4 security certification failed." }
Write-Host "v5.141D4 GREEN - Dependency & Security Hardening closed; next target: Performance & Bundle Optimization v5.142."
