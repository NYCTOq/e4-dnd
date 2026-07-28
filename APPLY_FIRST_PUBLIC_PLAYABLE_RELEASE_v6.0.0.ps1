$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v6.0.0 First Public Playable Release starting..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$payload = Join-Path $root "patch_payload"
$project = $root

function Copy-PayloadFile([string]$relative) {
  $source = Join-Path $payload $relative
  $target = Join-Path $project $relative
  if (-not (Test-Path $source)) { throw "Payload file missing: $relative" }
  $sourceFull = [IO.Path]::GetFullPath($source)
  $targetFull = [IO.Path]::GetFullPath($target)
  if ($sourceFull -eq $targetFull) { Write-Host "Self-copy skipped: $relative"; return }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item -Force $source $target
}

Copy-PayloadFile "src\core\release\publicReleaseReadiness-v6.ts"
Copy-PayloadFile "src\core\release\publicReleaseReadiness-v6.test.ts"
Copy-PayloadFile "scripts\package-public-release-v6.mjs"
Copy-PayloadFile "docs\release\CHANGELOG_v6.0.0.md"
Copy-PayloadFile "docs\release\PUBLIC_RELEASE_CHECKLIST_v6.0.0.md"
Copy-PayloadFile "docs\release\KNOWN_LIMITATIONS_v6.0.0.md"

$packagePath = Join-Path $project "package.json"
$package = Get-Content $packagePath -Raw | ConvertFrom-Json
$package.version = "6.0.0"
$package.scripts | Add-Member -Force -NotePropertyName "test:public-release" -NotePropertyValue "vitest run src/core/release/publicReleaseReadiness-v6.test.ts"
$package.scripts | Add-Member -Force -NotePropertyName "package:public-release" -NotePropertyValue "node scripts/package-public-release-v6.mjs"
$package.scripts | Add-Member -Force -NotePropertyName "certify:public-release" -NotePropertyValue "npm run test:public-release && npm run audit:security:context && npm run test:critical && npm run build && npm run audit:bundle-performance && npm run package:public-release"
$json = $package | ConvertTo-Json -Depth 100
[IO.File]::WriteAllText($packagePath, $json + "`n", [Text.UTF8Encoding]::new($false))
Write-Host "v6.0.0 source applied."

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v6.0.0 dependency refresh failed." }
npm.cmd run certify:public-release
if ($LASTEXITCODE -ne 0) { throw "v6.0.0 public release certification failed." }

$releaseName = "E4_DND_v6.0.0_PUBLIC"
$releaseDir = Join-Path $project ("release\" + $releaseName)
$zipPath = Join-Path $project ("release\" + $releaseName + ".zip")
if (-not (Test-Path $releaseDir)) { throw "Public release directory was not generated." }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path (Join-Path $releaseDir "*") -DestinationPath $zipPath -CompressionLevel Optimal
$hash = (Get-FileHash -Algorithm SHA256 $zipPath).Hash.ToLowerInvariant()
[IO.File]::WriteAllText($zipPath + ".sha256", $hash + "  " + [IO.Path]::GetFileName($zipPath) + "`n", [Text.UTF8Encoding]::new($false))
Write-Host "Public release ZIP: release\$releaseName.zip"
Write-Host "SHA-256: $hash"
Write-Host "v6.0.0 GREEN - First Public Playable Release closed."
