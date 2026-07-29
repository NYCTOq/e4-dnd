# E4 D&D v6.1D3.2 Final Four E2E Closure

D3.1 sonrasında kalan dört hata iki test beklentisinden oluşuyordu.

- Karakter detayında `E2E Journey` hem H1 hem H2 olarak bulunduğu için strict locator çakışıyordu.
- Offline test service worker sayfayı kontrol etmeden interneti kesiyordu.

Bu paket:

- Karakter detayını canonical level-1 heading üzerinden doğrular.
- Service worker'ın hazır olmasını bekler.
- Online kontrollü reload ile worker'ın sayfayı claim etmesini sağlar.
- `navigator.serviceWorker.controller` oluşmadan offline moda geçmez.
- Offline reload sonrasında ortak `#main-content` shell'ini doğrular.
- Hedefli E2E, unit suite, build ve tam E2E paketini çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FINAL_FOUR_E2E_CLOSURE_v6.1D3.2.ps1
```
