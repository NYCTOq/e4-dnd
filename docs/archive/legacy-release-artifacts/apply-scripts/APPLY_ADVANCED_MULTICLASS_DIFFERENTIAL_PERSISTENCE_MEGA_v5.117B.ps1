$ErrorActionPreference = "Stop"

Write-Host "E4 D&D v5.117B multiclass runtime certification is starting..." -ForegroundColor Cyan
npm install
npm run certify:multiclass:runtime

if ($LASTEXITCODE -ne 0) {
  throw "v5.117B certification failed."
}

Write-Host "v5.117B passed: Multiclass differential and persistence are GREEN." -ForegroundColor Green
