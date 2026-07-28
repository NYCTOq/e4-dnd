$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.135D1 Playable Gap Closure Self-Copy Hotfix starting..."

$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Get-Location).Path
$requiredFiles = @(
  "src\core\runtime\manualRuntimeBridge.ts",
  "src\core\runtime\manualRuntimeBridge-v5.135.test.ts",
  "src\features\play-mode\PlayMode.tsx",
  "src\styles\42-playable-gap-closure.css",
  "src\index.css",
  "package.json"
)

foreach ($relative in $requiredFiles) {
  $source = Join-Path $packageRoot $relative
  $target = Join-Path $projectRoot $relative

  if (-not (Test-Path $target)) {
    if (-not (Test-Path $source)) {
      throw "Missing v5.135 file in both project and hotfix package: $relative"
    }
    $targetDir = Split-Path -Parent $target
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -Force $source $target
    Write-Host "Restored missing file: $relative"
    continue
  }

  if (Test-Path $source) {
    $sourcePath = [System.IO.Path]::GetFullPath($source)
    $targetPath = [System.IO.Path]::GetFullPath($target)
    if (-not [System.String]::Equals($sourcePath, $targetPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      Copy-Item -Force $source $target
      Write-Host "Updated file: $relative"
    } else {
      Write-Host "File already in project location; self-copy skipped: $relative"
    }
  } else {
    Write-Host "Existing project file retained: $relative"
  }
}

$packagePath = Join-Path $projectRoot "package.json"
$package = Get-Content -Raw $packagePath | ConvertFrom-Json
if ($package.version -eq "5.135.0") {
  $package.version = "5.135.1"
  $package | ConvertTo-Json -Depth 100 | Set-Content -Encoding UTF8 $packagePath
  Write-Host "Package version updated to 5.135.1."
}

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.135D1 dependency verification failed." }

npm.cmd run certify:playable-gap-closure
if ($LASTEXITCODE -ne 0) { throw "v5.135D1 Playable Gap Closure certification failed." }

Write-Host "v5.135D1 GREEN - Playable Gap Closure closed; next target: Full Regression & Release Candidate v5.136."
