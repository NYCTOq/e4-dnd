$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$Audit = Join-Path $Root "n-mega6-subclass-feature-runtime.mjs"
if (-not (Test-Path $Audit)) { throw "N-MEGA6 audit dosyasi bulunamadi: $Audit" }
Write-Host "N-MEGA6 subclass ve feature runtime audit basliyor..."
& node $Audit
if ($LASTEXITCODE -ne 0) { throw "N-MEGA6 audit RED" }
$Tests = @(
 "src/core/rulesets/classFeatureRuntime.test.ts",
 "src/core/rulesets/subclassRuntimeRules.test.ts",
 "src/core/rulesets/subclassRuntimeCompletion-v5.131.test.ts",
 "src/core/rulesets/classSubclassRuntimeClosure.test.ts",
 "src/core/rulesets/runtimeCoverageCertification.test.ts",
 "src/core/rulesets/runtimeCoverageCertification.integration.test.ts",
 "src/core/rulesets/runtimeCoverageClosure.test.ts",
 "src/core/rulesets/runtimeGapClosure.test.ts",
 "src/certification/player-readiness/subclassRuntimeMatrix-v6.2C6.test.ts",
 "src/certification/matrix/classFeatureUsagePersistenceMatrix.test.ts",
 "src/certification/integration/classFeaturePersistenceBridge.test.ts",
 "src/certification/integration/runtimeEntityPersistenceBridge.test.ts",
 "src/certification/integration/runtimeCoverageMissingClosure.test.ts",
 "src/certification/oracle/runtimeCoverageOracle.test.ts",
 "src/certification/differential/runtimeCoverageDifferential.test.ts"
)
& npm.cmd exec -- vitest run @Tests
if ($LASTEXITCODE -ne 0) { throw "N-MEGA6 regression RED" }
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "N-MEGA6 build RED" }
Write-Host "N-MEGA6 GREEN"
