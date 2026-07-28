$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.142D1 Bundle Performance Test Type Hotfix starting..."

$testPath = Join-Path $PSScriptRoot "src\core\performance\bundlePerformanceBudget-v5.142.test.ts"
if (-not (Test-Path $testPath)) {
  $testPath = Join-Path (Get-Location) "src\core\performance\bundlePerformanceBudget-v5.142.test.ts"
}
if (-not (Test-Path $testPath)) { throw "v5.142 test file not found." }

$text = [System.IO.File]::ReadAllText($testPath)
$before = $text
$text = $text.Replace('some((item) => item.includes("forced shell chunk"))', 'some((item: string) => item.includes("forced shell chunk"))')
$text = $text.Replace('some((item) => item.includes("Entry asset"))', 'some((item: string) => item.includes("Entry asset"))')
if ($text -eq $before -and -not ($text.Contains('some((item: string) => item.includes("forced shell chunk"))') -and $text.Contains('some((item: string) => item.includes("Entry asset"))'))) {
  throw "v5.142D1 expected test anchors were not found."
}
[System.IO.File]::WriteAllText($testPath, $text, [System.Text.UTF8Encoding]::new($false))

$packagePath = Join-Path (Get-Location) "package.json"
$package = Get-Content -Raw $packagePath | ConvertFrom-Json
$package.version = "5.142.1"
$json = $package | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText($packagePath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Host "v5.142D1 TypeScript callback types applied."

npm.cmd run certify:bundle-performance
if ($LASTEXITCODE -ne 0) { throw "v5.142D1 Performance & Bundle Optimization certification failed." }

Write-Host "v5.142D1 GREEN - Performance & Bundle Optimization closed; next target: UX Polish & Onboarding v5.143."
