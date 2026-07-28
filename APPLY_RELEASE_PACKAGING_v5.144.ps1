$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.144 Release Packaging starting..."
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
  $parent = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Copy-Item -Force $source $target
}

Copy-PayloadFile "src\core\release\releasePackaging-v5.144.ts"
Copy-PayloadFile "src\core\release\releasePackaging-v5.144.test.ts"
Copy-PayloadFile "scripts\package-release-v5.144.mjs"
Copy-PayloadFile "docs\release\CHANGELOG_v5.144.md"
Copy-PayloadFile "docs\release\RELEASE_CHECKLIST_v5.144.md"

$packagePath = Join-Path $project "package.json"
$package = Get-Content $packagePath -Raw | ConvertFrom-Json
$package.version = "5.144.0"
$package.scripts | Add-Member -Force -NotePropertyName "test:release-packaging" -NotePropertyValue "vitest run src/core/release/releasePackaging-v5.144.test.ts"
$package.scripts | Add-Member -Force -NotePropertyName "package:release" -NotePropertyValue "node scripts/package-release-v5.144.mjs"
$package.scripts | Add-Member -Force -NotePropertyName "certify:release-packaging" -NotePropertyValue "npm run test:release-packaging && npm run build && npm run package:release"
$json = $package | ConvertTo-Json -Depth 100
[IO.File]::WriteAllText($packagePath, $json + "`n", [Text.UTF8Encoding]::new($false))
Write-Host "v5.144 source applied."

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.144 dependency refresh failed." }
npm.cmd run certify:release-packaging
if ($LASTEXITCODE -ne 0) { throw "v5.144 Release Packaging certification failed." }

$releaseName = "E4_DND_v5.144.0"
$releaseDir = Join-Path $project ("release\" + $releaseName)
$zipPath = Join-Path $project ("release\" + $releaseName + ".zip")
if (-not (Test-Path $releaseDir)) { throw "Release directory was not generated." }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path (Join-Path $releaseDir "*") -DestinationPath $zipPath -CompressionLevel Optimal
if (-not (Test-Path $zipPath)) { throw "Release ZIP was not generated." }
$hash = (Get-FileHash -Algorithm SHA256 $zipPath).Hash.ToLowerInvariant()
[IO.File]::WriteAllText($zipPath + ".sha256", $hash + "  " + [IO.Path]::GetFileName($zipPath) + "`n", [Text.UTF8Encoding]::new($false))
Write-Host "Release ZIP: release\$releaseName.zip"
Write-Host "SHA-256: $hash"
Write-Host "v5.144 GREEN - Release Packaging closed; next target: v6.0.0 First Public Playable Release."
