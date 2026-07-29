# E4 D&D v6.1D3.1 Last Five E2E Closure

D3 sonrasında 392 testten 384'ü geçti, 3'ü bilinçli skip edildi ve yalnızca 5 eski test beklentisi kaldı.

Bu paket:

- Karakter listesindeki düz isim metnini link sanmak yerine canonical karakter detay rotasına gider.
- Offline shell kanıtında mobilde bulunmayan masaüstü logo linkini aramak yerine ortak Dashboard heading'ini doğrular.
- Initiative düğmesinde ayrı `focus()` + global Enter yerine Playwright `locator.press("Enter")` kullanır.
- Hedefli üç E2E dosyasını, unit suite'i, build'i ve tam E2E paketini çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_LAST_FIVE_E2E_CLOSURE_v6.1D3.1.ps1
```
