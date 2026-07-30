# E4 D&D M-MEGA1 Final Distribution & Live Launch Closure

Bu paket kalan yayın işlerini tek yerde toplar:

- Git ve `v6.2.0` tag doğrulaması
- Public ZIP ve SHA-256 doğrulaması
- GitHub Release oluşturma veya güncelleme
- Release asset yükleme
- Apache upload ZIP
- Nginx upload ZIP
- Canlı URL smoke testi
- Fiziksel cihaz sonuç kaydı
- Staging rollback provası
- Final release regression
- Launch handoff özeti

## Ana komut

GitHub CLI kurulu ve giriş yapılmışsa:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FINAL_DISTRIBUTION_LAUNCH_M_MEGA1.ps1
```

Canlı URL hazırsa:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_FINAL_DISTRIBUTION_LAUNCH_M_MEGA1.ps1 -BaseUrl "https://site-adresi.com"
```

## Fiziksel cihaz sonucu kaydetme örneği

```powershell
powershell -ExecutionPolicy Bypass -File .\RECORD_DEVICE_ACCEPTANCE_M_MEGA1.ps1 `
  -WindowsChrome passed `
  -WindowsEdge passed `
  -AndroidChrome passed `
  -IphoneSafari unavailable `
  -InstalledPwaOnline passed `
  -InstalledPwaOffline passed `
  -DeepRouteRefresh passed `
  -SaveReloadPersistence passed `
  -Notes "iPhone fiziksel cihaz mevcut değildi."
```
