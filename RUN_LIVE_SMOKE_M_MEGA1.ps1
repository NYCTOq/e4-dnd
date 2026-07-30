param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$BaseUrl = $BaseUrl.TrimEnd("/")

Write-Host "E4 D&D live smoke: $BaseUrl" -ForegroundColor Cyan

$checks = @(
  @{ Name = "Home"; Path = "/" },
  @{ Name = "Manifest"; Path = "/manifest.webmanifest" },
  @{ Name = "Service Worker"; Path = "/sw.js" },
  @{ Name = "Builder"; Path = "/builder" },
  @{ Name = "Characters"; Path = "/characters" },
  @{ Name = "Play"; Path = "/play" },
  @{ Name = "Combat"; Path = "/combat" },
  @{ Name = "Rest"; Path = "/rest" },
  @{ Name = "Settings"; Path = "/settings" }
)

$results = @()
$failed = $false

foreach ($check in $checks) {
  $url = "$BaseUrl$($check.Path)"

  try {
    $response = Invoke-WebRequest $url -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 30
    $status = [int]$response.StatusCode
    $contentType = [string]$response.Headers["Content-Type"]
    $ok = $status -ge 200 -and $status -lt 500

    if (-not $ok) { $failed = $true }

    $results += [PSCustomObject]@{
      name = $check.Name
      url = $url
      status = $status
      contentType = $contentType
      bytes = $response.RawContentLength
      passed = $ok
    }

    Write-Host ("[{0}] {1} -> HTTP {2}" -f $(if ($ok) {"PASS"} else {"FAIL"}), $url, $status)
  }
  catch {
    $failed = $true
    $results += [PSCustomObject]@{
      name = $check.Name
      url = $url
      status = 0
      contentType = ""
      bytes = 0
      passed = $false
      error = $_.Exception.Message
    }
    Write-Host "[FAIL] $url -> $($_.Exception.Message)" -ForegroundColor Red
  }
}

$evidence = [PSCustomObject]@{
  generatedAt = (Get-Date).ToString("o")
  baseUrl = $BaseUrl
  passed = (-not $failed)
  checks = $results
}

$evidence | ConvertTo-Json -Depth 8 | Set-Content ".\release\LIVE_SMOKE_EVIDENCE_M_MEGA1.json" -Encoding utf8

if ($failed) {
  throw "Canli smoke testinde basarisiz endpoint var."
}

Write-Host ""
Write-Host "LIVE SMOKE GREEN - Tum ana endpointler erisilebilir." -ForegroundColor Green
