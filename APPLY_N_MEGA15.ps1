$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host 'N-MEGA15 REPO CLEANUP START'

# ------------------------------------------------------------------
# 1. Preserve historical patch/diagnostic helpers under archive/
# ------------------------------------------------------------------
$ArchiveRoot = Join-Path $Root 'archive\n-mega-history'
New-Item -ItemType Directory -Path $ArchiveRoot -Force | Out-Null

$patterns = @(
  'APPLY_N_MEGA*.ps1',
  'APPLY_N_MEGA*.mjs',
  'README_N_MEGA*.txt',
  'RUN_N_MEGA*.ps1',
  'N_MEGA*_DIAG*.txt',
  'N_MEGA*_README.txt'
)

$moved = 0
foreach ($pattern in $patterns) {
  Get-ChildItem -Path $Root -Filter $pattern -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike 'APPLY_N_MEGA15*' -and $_.Name -notlike 'README_N_MEGA15*' } |
    ForEach-Object {
      $destination = Join-Path $ArchiveRoot $_.Name
      Move-Item $_.FullName $destination -Force
      $moved++
    }
}

Write-Host "Archived helper files: $moved"

# Remove temporary backups created by prior packages.
$backupFiles = Get-ChildItem -Path $Root -Recurse -File -Filter '*.nmega*.bak' -ErrorAction SilentlyContinue
$backupCount = @($backupFiles).Count
$backupFiles | Remove-Item -Force
Write-Host "Removed temporary backups: $backupCount"

# ------------------------------------------------------------------
# 2. Stable line ending policy
# ------------------------------------------------------------------
$gitattributes = @'
* text=auto

*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.mjs text eol=lf
*.cjs text eol=lf
*.json text eol=lf
*.css text eol=lf
*.html text eol=lf
*.md text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.sh text eol=lf

*.ps1 text eol=crlf
*.bat text eol=crlf
*.cmd text eol=crlf

*.png binary
*.jpg binary
*.jpeg binary
*.webp binary
*.gif binary
*.ico binary
*.zip binary
*.pdf binary
'@

[System.IO.File]::WriteAllText(
  (Join-Path $Root '.gitattributes'),
  $gitattributes,
  [System.Text.UTF8Encoding]::new($false)
)

# ------------------------------------------------------------------
# 3. Extend .gitignore without deleting existing project rules
# ------------------------------------------------------------------
$gitignorePath = Join-Path $Root '.gitignore'
$existingIgnore = if (Test-Path $gitignorePath) {
  [System.IO.File]::ReadAllText($gitignorePath)
} else {
  ''
}

$ignoreBlock = @'

# N-MEGA15 generated and local-only artifacts
test-results/
playwright-report/
blob-report/
*.nmega*.bak
*.tmp
*.log
N_MEGA*_FEEDBACK_ENCODING_DIAG.txt
release/*_UPLOAD/
'@

if (-not $existingIgnore.Contains('# N-MEGA15 generated and local-only artifacts')) {
  [System.IO.File]::WriteAllText(
    $gitignorePath,
    ($existingIgnore.TrimEnd() + $ignoreBlock + [Environment]::NewLine),
    [System.Text.UTF8Encoding]::new($false)
  )
}

# ------------------------------------------------------------------
# 4. Produce cleanup report
# ------------------------------------------------------------------
$ReportDir = Join-Path $Root 'certification-reports\n-mega15'
New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

$report = [ordered]@{
  package = 'N-MEGA15'
  generatedAt = (Get-Date).ToString('o')
  archivedHelperFiles = $moved
  removedTemporaryBackups = $backupCount
  lineEndingPolicy = '.gitattributes'
  ignorePolicy = '.gitignore'
  qualityGates = @(
    'lint'
    'unit/integration tests'
    'production build'
    'full Playwright E2E'
  )
}

$report | ConvertTo-Json -Depth 5 |
  Set-Content -Path (Join-Path $ReportDir 'N_MEGA15_REPO_CLEANUP_FINAL_CERTIFICATION.json') -Encoding utf8

Write-Host 'N-MEGA15 cleanup completed.'
Write-Host ''

# ------------------------------------------------------------------
# 5. Quality gates
# ------------------------------------------------------------------
Write-Host 'LINT START'
& npm.cmd run lint
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA15 RED - LINT exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Host 'LINT GREEN'
Write-Host ''

Write-Host 'UNIT AND INTEGRATION TESTS START'
& npm.cmd test -- --run
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA15 RED - TEST exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Host 'UNIT AND INTEGRATION GREEN'
Write-Host ''

Write-Host 'BUILD START'
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA15 RED - BUILD exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Host 'BUILD GREEN'
Write-Host ''

Write-Host 'FULL PLAYWRIGHT START'
& npm.cmd exec playwright test -- --workers=4
if ($LASTEXITCODE -ne 0) {
  Write-Host "N-MEGA15 RED - PLAYWRIGHT exit=$LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Host 'FULL PLAYWRIGHT GREEN'
Write-Host ''

Write-Host 'GIT STATUS'
& git status --short

Write-Host ''
Write-Host 'N-MEGA15 REPO CLEANUP AND FINAL CERTIFICATION GREEN'
