$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "N-MEGA7C coklu hedef ve alan buyusu paketi uygulanıyor..."
node (Join-Path $Root "APPLY_N_MEGA7C.mjs")
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7C patch RED" }

npm.cmd exec vitest run -- `
  src/core/rulesets/spellMultiTargetResolution-N-MEGA7C.test.ts `
  src/core/rulesets/spellOutcomeResolution-N-MEGA7B.test.ts `
  src/core/rulesets/spellCastTransaction-N-MEGA7A.test.ts `
  src/core/rulesets/spellBehaviorRules.test.ts `
  src/core/rulesets/spellRuntimeCombatRules.test.ts `
  src/core/rulesets/spellResolution.test.ts
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7C tests RED" }

npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7C build RED" }

Write-Host "N-MEGA7C GREEN"
