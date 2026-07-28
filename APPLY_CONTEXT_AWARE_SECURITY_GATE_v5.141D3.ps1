$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.141D3 Context-Aware Security Gate starting..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$pkgPath = Join-Path $root "package.json"
$pkg = Get-Content -Raw -Encoding UTF8 $pkgPath | ConvertFrom-Json
$pkg.version = "5.141.3"
if (-not $pkg.scripts) { $pkg | Add-Member -NotePropertyName scripts -NotePropertyValue ([pscustomobject]@{}) }
$pkg.scripts | Add-Member -Force -NotePropertyName "audit:security:context" -NotePropertyValue "node scripts/context-aware-production-security-gate-v5.141D3.mjs"
$pkg.scripts | Add-Member -Force -NotePropertyName "certify:security-hardening" -NotePropertyValue "npm run audit:security:context && npm run test:critical && npm run build"
$json = $pkg | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText($pkgPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Host "package.json updated to 5.141.3; context-aware security gate installed."

npm.cmd run certify:security-hardening
if ($LASTEXITCODE -ne 0) { throw "v5.141D3 security certification failed." }
Write-Host "v5.141D3 GREEN - Dependency & Security Hardening closed; next target: Performance & Bundle Optimization v5.142."
