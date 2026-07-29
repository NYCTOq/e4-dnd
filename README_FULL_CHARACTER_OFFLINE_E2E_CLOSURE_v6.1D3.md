# E4 D&D v6.1D3 Full Character Journey & Offline E2E Closure

Bu paket D2.3 sonrasında kalan eski E2E kalıplarını otomatik dönüştürür.

## Yaptıkları

- Mobilde gizli masaüstü Builder step düğmelerini kullanmaz.
- `Aktif adım` seçicisini otomatik algılar.
- Eski `Class` label beklentisini kaldırır.
- Builder panelindeki select option'larını tarayıp gerçek class kontrolünü bulur.
- Select yoksa button, radio veya tam metin seçimine düşer.
- Offline reload sırasında beklenen `ERR_INTERNET_DISCONNECTED` hatasını kontrollü kabul eder.
- Eski sabit release-version fixture'larını günceller.
- Patch klasörlerindeki kazara kalan Playwright spec dosyalarını temizler.
- Hedefli E2E, unit suite, build ve tam E2E çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FULL_CHARACTER_OFFLINE_E2E_CLOSURE_v6.1D3.ps1
```
