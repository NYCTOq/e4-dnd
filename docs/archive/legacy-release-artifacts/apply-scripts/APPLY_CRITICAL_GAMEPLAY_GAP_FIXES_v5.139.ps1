$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.139 Critical Gameplay Gap Fixes starting..."
node .\scripts\install-critical-gameplay-gap-fixes-v5.139.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.139 source application failed." }
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.139 npm install failed." }
npm.cmd run certify:critical-gameplay-gap-fixes
if ($LASTEXITCODE -ne 0) { throw "v5.139 Critical Gameplay Gap Fixes certification failed." }
Write-Host "v5.139 GREEN - Critical Gameplay Gap Fixes closed; next target: Test & Repository Cleanup v5.140."
