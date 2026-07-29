# E4 D&D v6.1D1 Global E2E Overlay & Fixture Closure

Bu paket:

- Overlay davranışını gerçekten test eden dosyayı korur.
- Diğer tüm Playwright spec dosyalarına güncel uygulama sürümüyle deterministik başlangıç durumu ekler.
- Eski sabit sürüm değerlerini güncel `package.json` sürümüyle değiştirir.
- First-run guide ve release-notes pencerelerinin ilgisiz fiziksel testleri engellemesini önler.
- Skip-link testini klavye kullanım amacıyla uyumlu `Enter` aktivasyonuna geçirir.
- Golden 30 rapor okuyucusunu UTF-8 BOM karakterine dayanıklı hâle getirir.
- Önce hedefli E2E kümesini, ardından unit, build ve tüm E2E testlerini çalıştırır.

## Uygulama

ZIP içindeki klasörün içeriğini proje köküne çıkarın ve çalıştırın:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_GLOBAL_E2E_OVERLAY_FIXTURE_CLOSURE_v6.1D1.ps1
```
