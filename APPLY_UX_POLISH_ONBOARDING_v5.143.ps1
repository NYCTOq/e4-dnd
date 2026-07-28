$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.143 UX Polish & Onboarding starting..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$payload = Join-Path $root "patch_payload"
$project = $root
function Copy-PayloadFile([string]$relative) {
  $source = Join-Path $payload $relative
  $target = Join-Path $project $relative
  $parent = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Copy-Item -Force $source $target
}
Copy-PayloadFile "src\core\onboarding\onboardingProgress.ts"
Copy-PayloadFile "src\core\onboarding\onboardingProgress-v5.143.test.ts"
Copy-PayloadFile "src\features\dashboard\GettingStartedPanel.tsx"
Copy-PayloadFile "src\styles\43-ux-polish-onboarding.css"

$dashboardPath = Join-Path $project "src\features\dashboard\Dashboard.tsx"
$dashboard = [IO.File]::ReadAllText($dashboardPath)
if ($dashboard -notmatch 'GettingStartedPanel') {
  $anchor = 'import { CharacterHubActionLink } from "../characters/CharacterHubActionLink";'
  if (-not $dashboard.Contains($anchor)) { throw "Dashboard import anchor not found." }
  $dashboard = $dashboard.Replace($anchor, $anchor + "`n" + 'import { GettingStartedPanel } from "./GettingStartedPanel";')
  $renderAnchor = "    >`n      <section className=`"dashboard-command-grid`">"
  if (-not $dashboard.Contains($renderAnchor)) { throw "Dashboard render anchor not found." }
  $replacement = "    >`n      <GettingStartedPanel characterCount={characters.length} />`n      <section className=`"dashboard-command-grid`">"
  $dashboard = $dashboard.Replace($renderAnchor, $replacement)
  [IO.File]::WriteAllText($dashboardPath, $dashboard, [Text.UTF8Encoding]::new($false))
}

$indexPath = Join-Path $project "src\index.css"
$index = [IO.File]::ReadAllText($indexPath)
$import = '@import "./styles/43-ux-polish-onboarding.css";'
if (-not $index.Contains($import)) {
  $index = $import + "`n" + $index
  [IO.File]::WriteAllText($indexPath, $index, [Text.UTF8Encoding]::new($false))
}

$packagePath = Join-Path $project "package.json"
$package = Get-Content $packagePath -Raw | ConvertFrom-Json
$package.version = "5.143.0"
$package.scripts | Add-Member -Force -NotePropertyName "test:ux-onboarding" -NotePropertyValue "vitest run src/core/onboarding/onboardingProgress-v5.143.test.ts"
$package.scripts | Add-Member -Force -NotePropertyName "certify:ux-onboarding" -NotePropertyValue "npm run test:ux-onboarding && npm run build"
$json = $package | ConvertTo-Json -Depth 100
[IO.File]::WriteAllText($packagePath, $json + "`n", [Text.UTF8Encoding]::new($false))
Write-Host "v5.143 source applied."
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.143 dependency refresh failed." }
npm.cmd run certify:ux-onboarding
if ($LASTEXITCODE -ne 0) { throw "v5.143 UX Polish & Onboarding certification failed." }
Write-Host "v5.143 GREEN - UX Polish & Onboarding closed; next target: Release Packaging v5.144."
