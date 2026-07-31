$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$Log = Join-Path $Root "N_MEGA9_LAST_RUN.log"
cmd.exe /d /s /c "node APPLY_N_MEGA9.mjs > N_MEGA9_LAST_RUN.log 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "N-MEGA9 RED - PATCH"; Get-Content $Log -Tail 45; exit 1 }
cmd.exe /d /s /c "npm.cmd exec vitest run -- src/core/rulesets/multiclassAdvancementRuntime-N-MEGA9.test.ts src/core/rulesets/multiclassRules.test.ts src/core/rulesets/multiclassOfficialCertification.test.ts src/core/rulesets/multiclassPactMagic.test.ts src/core/rulesets/multiclassSpellcastingSeparation.test.ts > N_MEGA9_LAST_RUN.log 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "N-MEGA9 RED - TEST"; Get-Content $Log -Tail 45; exit 1 }
cmd.exe /d /s /c "npm.cmd run build > N_MEGA9_LAST_RUN.log 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "N-MEGA9 RED - BUILD"; Get-Content $Log -Tail 45; exit 1 }
Remove-Item $Log -Force -ErrorAction SilentlyContinue
Write-Host "N-MEGA9 GREEN"
