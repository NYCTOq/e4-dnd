$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.138 Content Coverage Matrix starting..."
node .\scripts\install-content-coverage-matrix-v5.138.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.138 installer failed." }
npm.cmd run certify:content-coverage
if ($LASTEXITCODE -ne 0) { throw "v5.138 Content Coverage Matrix certification failed." }
Write-Host "v5.138 GREEN - Content Coverage Matrix closed; next target: Critical Gameplay Gap Fixes v5.139."
