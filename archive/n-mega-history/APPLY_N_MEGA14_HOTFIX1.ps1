$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Target = Join-Path $Root 'src\core\character\characterCalculatorMulticlass.N-MEGA14.test.ts'
if (-not (Test-Path $Target)) {
  throw "Target not found: $Target"
}

$content = [System.IO.File]::ReadAllText($Target)

$old = '} as Character;'
$new = '} as unknown as Character;'

if (-not $content.Contains($old)) {
  throw "Expected test cast not found."
}

$content = $content.Replace($old, $new)

[System.IO.File]::WriteAllText(
  $Target,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host 'N-MEGA14 HOTFIX1 test fixture cast fixed.'
Write-Host 'FOCUSED UNIT TESTS START'

& npm.cmd exec vitest run -- `
  src/core/rulesets/ancestryRuntimeRules.N-MEGA14.test.ts `
  src/core/character/characterCalculatorMulticlass.N-MEGA14.test.ts

if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA14 HOTFIX1 RED - UNIT exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host 'BUILD START'

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA14 HOTFIX1 RED - BUILD exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host 'N-MEGA14 HOTFIX1 GREEN'
