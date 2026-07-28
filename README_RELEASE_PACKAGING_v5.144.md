# E4 D&D v5.144 - Release Packaging

Production build'i sürümlü dağıtım klasörüne toplar; release manifesti, SHA-256 listesi, changelog, checklist, README ve SRD attribution dosyalarını ekler. Sonunda tek ZIP ve ZIP checksum dosyası üretir.

## Uygulama

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_RELEASE_PACKAGING_v5.144.ps1
```

## Çıktı

- `release\E4_DND_v5.144.0\`
- `release\E4_DND_v5.144.0.zip`
- `release\E4_DND_v5.144.0.zip.sha256`
- `reports\RELEASE_PACKAGING_v5.144.md`
- `reports\RELEASE_PACKAGING_v5.144.json`
