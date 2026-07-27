$ErrorActionPreference = "Stop"

Write-Host "v5.117D Advanced Multiclass Final Closure certification starting..." -ForegroundColor Cyan
npm install
npm run certify:multiclass:final
if ($LASTEXITCODE -ne 0) {
  throw "v5.117D certification failed."
}

Write-Host "v5.117D certification GREEN." -ForegroundColor Green
