# E4 D&D v6.1D3.3 Final E2E & Contract Closure

D3.2 sonrasında offline testler geçti. Kalan sorunlar:

- `/characters` liste sayfasındaki karakter adı H2 olmasına rağmen test H1 arıyordu.
- Derived stats E2E testi `button.press("Enter")` ile başarıyla çalışırken unit sözleşmesi yalnızca eski `keyboard.press("Enter")` metnini kabul ediyordu.
- Patch staging klasörlerinde kalan test kopyaları Vitest tarafından tekrar keşfediliyordu.

Bu paket:

- Liste sayfasında karakter kartının H2 başlığını doğrular.
- Detay sayfasında canonical H1 doğrulamasını korur.
- Unit sözleşmesini hem `keyboard.press("Enter")` hem de locator `.press("Enter")` yollarını kabul edecek şekilde günceller.
- `patch_payload` ve `payload` altındaki test kopyalarını temizler.
- Hedefli E2E, hedefli unit contract, tam unit suite, build ve tam E2E çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FINAL_E2E_CONTRACT_CLOSURE_v6.1D3.3.ps1
```
