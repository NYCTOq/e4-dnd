$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.142D2 Entry Chunk Split Hotfix starting..."
node .\scripts\install-entry-chunk-split-v5.142D2.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.142D2 source application failed." }
npm.cmd run certify:bundle-performance
if ($LASTEXITCODE -ne 0) { throw "v5.142D2 Performance & Bundle Optimization certification failed." }
Write-Host "v5.142D2 GREEN - Performance & Bundle Optimization closed; next target: UX Polish & Onboarding v5.143."
