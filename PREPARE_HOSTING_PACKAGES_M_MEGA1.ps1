$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "E4 D&D hosting paketleri hazirlaniyor..." -ForegroundColor Cyan

$source = ".\deployment\e4-dnd-6.2.0-public"
$apacheOut = ".\release\E4_DND_6.2.0_APACHE_UPLOAD"
$nginxOut = ".\release\E4_DND_6.2.0_NGINX_UPLOAD"
$apacheZip = ".\release\E4_DND_6.2.0_APACHE_UPLOAD.zip"
$nginxZip = ".\release\E4_DND_6.2.0_NGINX_UPLOAD.zip"

if (-not (Test-Path $source)) {
  throw "Public deployment klasoru eksik: $source"
}

foreach ($path in @($apacheOut, $nginxOut)) {
  if (Test-Path $path) {
    Remove-Item $path -Recurse -Force
  }
  New-Item -ItemType Directory -Path $path -Force | Out-Null
  Copy-Item "$source\*" $path -Recurse -Force
}

$apacheExample = ".\deployment\hosting-examples\apache-spa-pwa.htaccess.example"
$nginxExample = ".\deployment\hosting-examples\nginx-spa-pwa.conf.example"

if (-not (Test-Path $apacheExample)) { throw "Apache hosting ornegi eksik." }
if (-not (Test-Path $nginxExample)) { throw "Nginx hosting ornegi eksik." }

Copy-Item $apacheExample "$apacheOut\.htaccess" -Force
Copy-Item $nginxExample "$nginxOut\nginx-spa-pwa.conf.example" -Force

@"
APACHE YUKLEME PAKETI

Bu klasorun ICERIGINI hosting document root'a yukle.
.htaccess dosyasi SPA deep-route fallback ve PWA cache basliklarini icerir.
Hosting firmasinin .htaccess kurallarini destekledigini dogrula.
"@ | Set-Content "$apacheOut\UPLOAD_README.txt" -Encoding utf8

@"
NGINX YUKLEME PAKETI

Uygulama dosyalarini document root'a yukle.
nginx-spa-pwa.conf.example dosyasini dogrudan web root'a birakmak yetmez.
Kurallari Nginx server block icine hosting yoneticisi uygulamalidir.
"@ | Set-Content "$nginxOut\UPLOAD_README.txt" -Encoding utf8

foreach ($zip in @($apacheZip, $nginxZip)) {
  if (Test-Path $zip) { Remove-Item $zip -Force }
}

Compress-Archive -Path "$apacheOut\*" -DestinationPath $apacheZip -CompressionLevel Optimal
Compress-Archive -Path "$nginxOut\*" -DestinationPath $nginxZip -CompressionLevel Optimal

$apacheHash = (Get-FileHash $apacheZip -Algorithm SHA256).Hash.ToLowerInvariant()
$nginxHash = (Get-FileHash $nginxZip -Algorithm SHA256).Hash.ToLowerInvariant()

"$apacheHash  E4_DND_6.2.0_APACHE_UPLOAD.zip" | Set-Content ".\release\E4_DND_6.2.0_APACHE_UPLOAD.sha256" -Encoding utf8
"$nginxHash  E4_DND_6.2.0_NGINX_UPLOAD.zip" | Set-Content ".\release\E4_DND_6.2.0_NGINX_UPLOAD.sha256" -Encoding utf8

Write-Host ""
Write-Host "HOSTING PACKAGES GREEN" -ForegroundColor Green
Write-Host "  release\E4_DND_6.2.0_APACHE_UPLOAD.zip"
Write-Host "  release\E4_DND_6.2.0_NGINX_UPLOAD.zip"
