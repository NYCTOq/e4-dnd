$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.133 Feat & Item Runtime Mega starting..."
node .\scripts\apply-feat-item-runtime-v5.133.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.133 apply step failed." }
npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "v5.133 npm install failed." }
npm.cmd run certify:feat-item-runtime-completion
if ($LASTEXITCODE -ne 0) { throw "v5.133 Feat & Item Runtime certification failed." }
Write-Host "v5.133 GREEN - Feat & Item Runtime closed; next target: Session Play Loop Mega v5.134."
