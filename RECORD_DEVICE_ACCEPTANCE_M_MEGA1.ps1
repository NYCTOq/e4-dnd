param(
  [ValidateSet("passed", "failed", "unavailable", "pending")]
  [string]$WindowsChrome = "pending",

  [ValidateSet("passed", "failed", "unavailable", "pending")]
  [string]$WindowsEdge = "pending",

  [ValidateSet("passed", "failed", "unavailable", "pending")]
  [string]$AndroidChrome = "pending",

  [ValidateSet("passed", "failed", "unavailable", "pending")]
  [string]$IphoneSafari = "pending",

  [ValidateSet("passed", "failed", "unavailable", "pending")]
  [string]$InstalledPwaOnline = "pending",

  [ValidateSet("passed", "failed", "unavailable", "pending")]
  [string]$InstalledPwaOffline = "pending",

  [ValidateSet("passed", "failed", "unavailable", "pending")]
  [string]$DeepRouteRefresh = "pending",

  [ValidateSet("passed", "failed", "unavailable", "pending")]
  [string]$SaveReloadPersistence = "pending",

  [string]$Notes = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$payload = [PSCustomObject]@{
  generatedAt = (Get-Date).ToString("o")
  release = "6.2.0"
  windowsChrome = $WindowsChrome
  windowsEdge = $WindowsEdge
  androidChrome = $AndroidChrome
  iphoneSafari = $IphoneSafari
  installedPwaOnline = $InstalledPwaOnline
  installedPwaOffline = $InstalledPwaOffline
  deepRouteRefresh = $DeepRouteRefresh
  saveReloadPersistence = $SaveReloadPersistence
  notes = $Notes
}

$payload | ConvertTo-Json -Depth 5 | Set-Content ".\release\PHYSICAL_DEVICE_EVIDENCE_M_MEGA1.json" -Encoding utf8

Write-Host "DEVICE EVIDENCE SAVED - release\PHYSICAL_DEVICE_EVIDENCE_M_MEGA1.json" -ForegroundColor Green
