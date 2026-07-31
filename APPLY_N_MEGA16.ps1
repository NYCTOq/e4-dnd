$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$ReleaseRoot = Join-Path $Root "release\n-mega16"
$ReportRoot = Join-Path $Root "certification-reports\n-mega16"
$DistRoot = Join-Path $Root "dist"
$ReleaseZip = Join-Path $ReleaseRoot "e4-dnd-v$Version-web.zip"
$ChecksumFile = "$ReleaseZip.sha256"
$LintLog = Join-Path $ReportRoot "N_MEGA16_LINT_OUTPUT.txt"
$ManifestFile = Join-Path $ReleaseRoot "N_MEGA16_RELEASE_MANIFEST.json"

New-Item -ItemType Directory -Path $ReleaseRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ReportRoot -Force | Out-Null

Write-Host 'N-MEGA16 RELEASE CANDIDATE START'
Write-Host "Project version: $Version"
Write-Host ''

Write-Host 'LINT AUDIT START'
$lintTemp = Join-Path $env:TEMP 'e4-dnd-nmega16-lint.txt'
if (Test-Path $lintTemp) {
  Remove-Item $lintTemp -Force
}

& cmd.exe /d /s /c "npm.cmd run lint > `"$lintTemp`" 2>&1"
$lintExit = $LASTEXITCODE

$lintOutput = if (Test-Path $lintTemp) {
  Get-Content $lintTemp
} else {
  @()
}

$lintOutput | Tee-Object -FilePath $LintLog | ForEach-Object { Write-Host $_ }

if (Test-Path $lintTemp) {
  Remove-Item $lintTemp -Force
}

if ($lintExit -ne 0) {
  Write-Host "N-MEGA16 RED - LINT exit=$lintExit"
  exit $lintExit
}

$warningMatch = ($lintOutput | Select-String -Pattern 'Found\s+(\d+)\s+warnings?\s+and\s+(\d+)\s+errors?' | Select-Object -Last 1)
$warningCount = 0
$errorCount = 0
if ($warningMatch) {
  $warningCount = [int]$warningMatch.Matches[0].Groups[1].Value
  $errorCount = [int]$warningMatch.Matches[0].Groups[2].Value
}

if ($errorCount -ne 0) {
  throw "Lint reported $errorCount errors."
}

Write-Host "LINT AUDIT GREEN - warnings=$warningCount errors=$errorCount"
Write-Host ''

Write-Host 'UNIT AND INTEGRATION TESTS START'
& npm.cmd test -- --run
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA16 RED - TEST exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Host 'UNIT AND INTEGRATION GREEN'
Write-Host ''

Write-Host 'CLEAN PRODUCTION BUILD START'
if (Test-Path $DistRoot) {
  Remove-Item $DistRoot -Recurse -Force
}

& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA16 RED - BUILD exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}

if (-not (Test-Path (Join-Path $DistRoot 'index.html'))) {
  throw 'Build completed but dist/index.html was not found.'
}

Write-Host 'BUILD GREEN'
Write-Host ''

Write-Host 'RELEASE ARCHIVE START'
if (Test-Path $ReleaseZip) {
  Remove-Item $ReleaseZip -Force
}
if (Test-Path $ChecksumFile) {
  Remove-Item $ChecksumFile -Force
}

Compress-Archive -Path (Join-Path $DistRoot '*') -DestinationPath $ReleaseZip -CompressionLevel Optimal

$hash = (Get-FileHash -Path $ReleaseZip -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  $(Split-Path $ReleaseZip -Leaf)" |
  Set-Content -Path $ChecksumFile -Encoding ascii

$distFiles = Get-ChildItem -Path $DistRoot -Recurse -File
$totalBytes = ($distFiles | Measure-Object -Property Length -Sum).Sum
$zipBytes = (Get-Item $ReleaseZip).Length

$manifest = [ordered]@{
  package = 'N-MEGA16'
  project = 'e4-dnd'
  version = $Version
  generatedAt = (Get-Date).ToString('o')
  sourceBranch = (& git branch --show-current).Trim()
  sourceCommit = (& git rev-parse HEAD).Trim()
  lint = [ordered]@{
    errors = $errorCount
    warnings = $warningCount
    log = 'certification-reports/n-mega16/N_MEGA16_LINT_OUTPUT.txt'
  }
  tests = 'passed'
  build = 'passed'
  artifact = [ordered]@{
    file = (Split-Path $ReleaseZip -Leaf)
    sha256 = $hash
    files = @($distFiles).Count
    uncompressedBytes = $totalBytes
    zipBytes = $zipBytes
  }
}

$manifest | ConvertTo-Json -Depth 8 |
  Set-Content -Path $ManifestFile -Encoding utf8

Write-Host "Release ZIP: $ReleaseZip"
Write-Host "SHA256: $hash"
Write-Host "Manifest: $ManifestFile"
Write-Host ''
Write-Host 'GIT STATUS'
& git status --short
Write-Host ''
Write-Host 'N-MEGA16 RELEASE CANDIDATE GREEN'
