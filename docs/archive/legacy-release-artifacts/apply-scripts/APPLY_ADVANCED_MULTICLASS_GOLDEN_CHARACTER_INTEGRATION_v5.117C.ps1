$ErrorActionPreference = "Stop"

Write-Host "E4 D&D v5.117C multiclass golden integration is starting..." -ForegroundColor Cyan
npm install
npm run certify:multiclass:integration

if ($LASTEXITCODE -ne 0) {
  throw "v5.117C certification failed."
}

Write-Host "v5.117C passed: Golden multiclass character integration is GREEN." -ForegroundColor Green
