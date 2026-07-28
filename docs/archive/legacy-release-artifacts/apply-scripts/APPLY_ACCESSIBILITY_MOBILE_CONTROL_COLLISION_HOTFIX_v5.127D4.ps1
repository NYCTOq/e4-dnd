$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.127D4 Accessibility Mobile Control Collision Hotfix starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

npm.cmd run certify:accessibility-essentials
if ($LASTEXITCODE -ne 0) { throw "v5.127D4 Accessibility Essentials certification failed." }

Write-Host "v5.127D4 GREEN - mobile fixed controls no longer overlap; Accessibility Essentials closed." -ForegroundColor Green
