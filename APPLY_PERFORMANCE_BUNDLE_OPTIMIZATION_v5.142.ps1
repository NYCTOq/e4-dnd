$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.142 Performance & Bundle Optimization starting..."

node .\scripts\install-performance-bundle-optimization-v5.142.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.142 source application failed." }

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.142 dependency refresh failed." }

npm.cmd run certify:bundle-performance
if ($LASTEXITCODE -ne 0) { throw "v5.142 Performance & Bundle Optimization certification failed." }

Write-Host "v5.142 GREEN - Performance & Bundle Optimization closed; next target: UX Polish & Onboarding v5.143."
