$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
Write-Host "N-MEGA7B spell outcome resolution uygulanıyor..."
node (Join-Path $Root "APPLY_N_MEGA7B.mjs")
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7B patch RED" }
Write-Host "Spell outcome ve mevcut casting regression testleri çalıştırılıyor..."
npm.cmd exec vitest run src/core/rulesets/spellOutcomeResolution-N-MEGA7B.test.ts src/core/rulesets/spellCastTransaction-N-MEGA7A.test.ts src/core/rulesets/spellResolution.test.ts src/core/rulesets/spellRuntimeCompletion-v5.132.test.ts src/core/rulesets/globalSpellRuntime.test.ts src/certification/integration/spellCastingPersistenceBridge.test.ts
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7B tests RED" }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7B build RED" }
Write-Host "N-MEGA7B GREEN"
