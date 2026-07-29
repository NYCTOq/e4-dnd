$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1 Thirty Golden Character Certification starting..."
node .\scripts\install-thirty-golden-character-certification-v6.1.mjs
if ($LASTEXITCODE -ne 0) { throw "Golden 30 installer failed." }

New-Item -ItemType Directory -Force .\reports | Out-Null
$results = [ordered]@{}

& npm.cmd run test:golden-30
$results.goldenOracle = $LASTEXITCODE

& npm.cmd test
$results.fullUnitSuite = $LASTEXITCODE

& npm.cmd run build
$results.productionBuild = $LASTEXITCODE

if ((Get-Content .\package.json -Raw | ConvertFrom-Json).scripts.PSObject.Properties.Name -contains "test:e2e") {
  & npm.cmd run test:e2e
  $results.fullE2E = $LASTEXITCODE
} else {
  $results.fullE2E = 127
}

$results | ConvertTo-Json | Set-Content -Encoding utf8 .\reports\GOLDEN_30_COMMAND_RESULTS_v6.1.json
node .\scripts\thirty-golden-character-audit-v6.1.mjs
$auditExit = $LASTEXITCODE

Write-Host "Reports:"
Write-Host "  reports\THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.md"
Write-Host "  reports\THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.json"
Write-Host "  reports\THIRTY_GOLDEN_CHARACTER_CERTIFICATION_v6.1.csv"
if ($auditExit -ne 0) { throw "v6.1 certification found failures. Send the Markdown and JSON reports for diagnosis." }
Write-Host "v6.1 GREEN - Thirty Golden Character Certification passed."
