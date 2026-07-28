$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.137 Full Playability Audit starting..."
node .\scripts\install-full-playability-audit-v5.137.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.137 installer failed." }
npm.cmd run certify:full-playability
if ($LASTEXITCODE -ne 0) { throw "v5.137 Full Playability Audit certification failed." }
Write-Host "v5.137 GREEN - Full Playability Audit closed; next target: Content Coverage Matrix v5.138."
