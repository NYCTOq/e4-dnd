$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.133D1 Feat & Item Fixture Type Hotfix starting..."
node .\scripts\apply-feat-item-test-fixture-v5.133D1.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.133D1 file application failed." }
npm.cmd run certify:feat-item-runtime-completion
if ($LASTEXITCODE -ne 0) { throw "v5.133D1 Feat & Item Runtime certification failed." }
Write-Host "v5.133D1 GREEN - Feat & Item Runtime closed; next target: Session Play Loop Mega v5.134."
