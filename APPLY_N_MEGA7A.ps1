$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
Write-Host "N-MEGA7A gerçek spell casting paketi uygulanıyor..."
node (Join-Path $Root "APPLY_N_MEGA7A.mjs")
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7A patch RED" }
Write-Host "Atomic cast, spell runtime ve persistence testleri çalıştırılıyor..."
npm.cmd exec vitest run src/core/rulesets/spellCastTransaction-N-MEGA7A.test.ts src/core/rulesets/spellRuntimeCompletion-v5.132.test.ts src/core/rulesets/globalSpellRuntime.test.ts src/core/rulesets/spellResolution.test.ts src/core/rulesets/multiclassSpellcastingSeparation.test.ts src/certification/integration/spellCastingPersistenceBridge.test.ts src/certification/matrix/spellCastingUiPersistenceMatrix.test.ts
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7A tests RED" }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "N-MEGA7A build RED" }
Write-Host "N-MEGA7A GREEN"
