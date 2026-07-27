$ErrorActionPreference = "Stop"

Write-Host "E4 D&D v5.117A multiclass foundation certification is starting..." -ForegroundColor Cyan
npm install
npm run certify:multiclass:foundation

if ($LASTEXITCODE -ne 0) {
  throw "v5.117A certification failed."
}

Write-Host "v5.117A passed: Advanced Multiclass foundation is GREEN." -ForegroundColor Green
