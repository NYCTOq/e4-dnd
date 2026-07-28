$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.128D1 Windows Release Gate Spawn Hotfix starting..." -ForegroundColor Cyan

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

npm.cmd run certify:release-hardening
if ($LASTEXITCODE -ne 0) { throw "v5.128D1 Release Hardening certification failed." }

Write-Host "v5.128D1 GREEN - Windows release gate runner fixed; Release Hardening closed." -ForegroundColor Green
