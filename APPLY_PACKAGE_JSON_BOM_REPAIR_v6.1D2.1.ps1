$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.1D2.1 package.json BOM repair starting..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".\package.json")) {
  throw "package.json not found. Extract patch contents into project root."
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Repair package.json by removing UTF-8 BOM if present.
$packagePath = Join-Path $root "package.json"
$packageText = [System.IO.File]::ReadAllText($packagePath)
$packageText = $packageText.TrimStart([char]0xFEFF)
[System.IO.File]::WriteAllText($packagePath, $packageText, $utf8NoBom)

# Validate JSON immediately.
try {
  $pkg = $packageText | ConvertFrom-Json
} catch {
  throw "package.json is still invalid JSON after BOM repair: $($_.Exception.Message)"
}

# Repair D2 installer so rerunning it never reintroduces BOM.
$installerPath = Join-Path $root "APPLY_RESPONSIVE_SHELL_BUILDER_E2E_CLOSURE_v6.1D2.ps1"
if (Test-Path $installerPath) {
  $installer = [System.IO.File]::ReadAllText($installerPath)
  $old = '$pkg | ConvertTo-Json -Depth 100 | Set-Content ".\package.json" -Encoding UTF8'
  $new = '$packageJson = $pkg | ConvertTo-Json -Depth 100' + [Environment]::NewLine +
         '[System.IO.File]::WriteAllText((Join-Path $root "package.json"), $packageJson, (New-Object System.Text.UTF8Encoding($false)))'
  if ($installer.Contains($old)) {
    $installer = $installer.Replace($old, $new)
    [System.IO.File]::WriteAllText($installerPath, $installer, $utf8NoBom)
  }
}

New-Item -ItemType Directory -Path ".\reports" -Force | Out-Null

npm.cmd run test:e2e:responsive-closure
$targeted = $LASTEXITCODE

npm.cmd run test
$unit = $LASTEXITCODE

npm.cmd run build
$build = $LASTEXITCODE

$results = [ordered]@{
  packageJsonBomRepair = 0
  targetedE2E = $targeted
  unitSuite = $unit
  productionBuild = $build
}

$json = $results | ConvertTo-Json
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\PACKAGE_JSON_BOM_REPAIR_RESULTS_v6.1D2.1.json"),
  $json,
  $utf8NoBom
)

$md = @"
# E4 D&D v6.1D2.1 package.json BOM Repair

- package.json BOM repair: 0
- Targeted E2E: $targeted
- Unit suite: $unit
- Production build: $build
"@
[System.IO.File]::WriteAllText(
  (Join-Path $root "reports\PACKAGE_JSON_BOM_REPAIR_RESULTS_v6.1D2.1.md"),
  $md,
  $utf8NoBom
)

if ($targeted -ne 0 -or $unit -ne 0 -or $build -ne 0) {
  Write-Host "v6.1D2.1 PARTIAL - BOM repaired; remaining failures are real test issues." -ForegroundColor Yellow
  exit 1
}

Write-Host "v6.1D2.1 GREEN - package.json BOM repaired and core gates passed." -ForegroundColor Green
