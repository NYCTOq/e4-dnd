# L-MEGA1 Live Hosting Smoke

Replace `https://example.com` with the actual deployment URL.

```powershell
$base = "https://example.com"

Invoke-WebRequest "$base/" -UseBasicParsing
Invoke-WebRequest "$base/manifest.webmanifest" -UseBasicParsing
Invoke-WebRequest "$base/sw.js" -UseBasicParsing
Invoke-WebRequest "$base/builder" -UseBasicParsing
Invoke-WebRequest "$base/characters" -UseBasicParsing
Invoke-WebRequest "$base/play" -UseBasicParsing
```

Confirm:

- [ ] Every response is below HTTP 500
- [ ] Deep routes return the application shell
- [ ] Manifest uses the expected content
- [ ] Service worker is reachable
- [ ] HTTPS is valid
- [ ] No redirect loop exists
- [ ] User-save storage survives refresh
