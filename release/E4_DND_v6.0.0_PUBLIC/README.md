# Certification E2E Selector Hotfix v5.105B.2

Bu hotfix:

- İlk açılış overlay'ini test ortamında CSS ve DOM üzerinden etkisizleştirir.
- Desktop builder step tıklamasında overlay engelini `force` ile aşar.
- Mobil builder step navigasyonunu DOM click ile çalıştırır.
- Race/Species alanını belirsiz label yerine seçenek içeriğinden bulur.

## Uygulama

ZIP içeriğini proje köküne çıkarın:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CERTIFICATION_E2E_SELECTOR_HOTFIX.ps1
```
