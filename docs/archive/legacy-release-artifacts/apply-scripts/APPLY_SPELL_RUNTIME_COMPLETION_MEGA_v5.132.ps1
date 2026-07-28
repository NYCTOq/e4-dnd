$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.132 Spell Runtime Completion Mega starting..."

node .\scripts\apply-spell-runtime-completion-v5.132.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.132 apply step failed." }

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.132 npm install failed." }

npm.cmd run certify:spell-runtime-completion
if ($LASTEXITCODE -ne 0) { throw "v5.132 Spell Runtime Completion certification failed." }

Write-Host "v5.132 GREEN - Spell Runtime Completion closed; next target: Feat & Item Runtime Mega v5.133."
