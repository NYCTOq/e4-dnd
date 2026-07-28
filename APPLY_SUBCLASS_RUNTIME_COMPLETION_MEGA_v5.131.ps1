$ErrorActionPreference = "Stop"
Write-Host "E4 D&D v5.131 Subclass Runtime Completion Mega starting..."

if (-not (Test-Path ".\package.json")) {
  throw "Run this script from the E4 D&D project root."
}

node .\scripts\install-subclass-runtime-completion-v5.131.mjs
if ($LASTEXITCODE -ne 0) { throw "v5.131 installer failed." }

npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

npm.cmd run certify:subclass-runtime-completion
if ($LASTEXITCODE -ne 0) { throw "v5.131 Subclass Runtime Completion certification failed." }

Write-Host "v5.131 GREEN - Subclass Runtime Completion closed; next target: Spell Runtime Completion Mega v5.132."
