$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.129 Playable Content Audit & Priority Map starting..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

node .\scripts\install-playable-content-audit-v5.129.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.129 package installation failed." }

npm.cmd run certify:playable-content-audit
if ($LASTEXITCODE -ne 0) { throw "v5.129 Playable Content Audit certification failed." }

Write-Host "v5.129 GREEN - playable content map generated; next target: Class Runtime Completion Mega v5.130."
