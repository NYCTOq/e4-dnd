$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.136 Full Regression & Release Candidate starting..."
node .\scripts\install-full-regression-rc-v5.136.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.136 source application failed." }
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.136 dependency verification failed." }
npm.cmd run certify:release-candidate-v5.136
if ($LASTEXITCODE -ne 0) { throw "v5.136 release candidate certification failed." }
Write-Host "v5.136 GREEN - Full Regression & Release Candidate closed. Stop point reached for roadmap review."
