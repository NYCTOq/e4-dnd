$ErrorActionPreference = "Stop"

Write-Host "E4 D&D v5.116 shell overlay certification is starting..." -ForegroundColor Cyan
npm install
npm run certify:shell-overlay:release

if ($LASTEXITCODE -ne 0) {
  throw "v5.116 certification failed."
}

Write-Host "v5.116 passed: desktop + mobile physical pointer safety is GREEN." -ForegroundColor Green
