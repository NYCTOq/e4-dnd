$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$Log = Join-Path $Root "N_MEGA8_LAST_RUN.log"
if (Test-Path $Log) { Remove-Item $Log -Force }

cmd.exe /d /s /c "node APPLY_N_MEGA8.mjs > N_MEGA8_LAST_RUN.log 2>&1"
if ($LASTEXITCODE -ne 0) { Get-Content $Log -Tail 45; throw "N-MEGA8 RED - PATCH" }

cmd.exe /d /s /c "npm.cmd exec vitest run -- src/core/rulesets/inventoryActionRuntime-N-MEGA8.test.ts src/core/rulesets/inventoryEconomyRuntime.test.ts src/core/rulesets/equipmentRuntimeRules.test.ts src/core/rulesets/itemUseRules.test.ts src/core/rulesets/inventoryAttackRuntimeOfficial.test.ts > N_MEGA8_LAST_RUN.log 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "N-MEGA8 RED - TEST"; Get-Content $Log -Tail 45; exit 1 }

cmd.exe /d /s /c "npm.cmd run build > N_MEGA8_LAST_RUN.log 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "N-MEGA8 RED - BUILD"; Get-Content $Log -Tail 45; exit 1 }

Remove-Item $Log -Force -ErrorAction SilentlyContinue
Write-Host "N-MEGA8 GREEN"
