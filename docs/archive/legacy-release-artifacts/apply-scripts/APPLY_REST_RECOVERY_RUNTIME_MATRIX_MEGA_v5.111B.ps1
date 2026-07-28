$ErrorActionPreference="Stop"
Write-Host "v5.111B Rest Recovery Runtime Matrix Mega uygulanıyor..." -ForegroundColor Cyan
node .\scripts\apply-rest-recovery-runtime-matrix-v5-111B.mjs
if($LASTEXITCODE-ne 0){throw "v5.111B kurulum başarısız."}
npm.cmd run certify:rest-recovery:runtime
if($LASTEXITCODE-ne 0){throw "v5.111B runtime sertifikasyonu başarısız."}
Write-Host "v5.111B runtime sertifikasyonu başarılı." -ForegroundColor Green
