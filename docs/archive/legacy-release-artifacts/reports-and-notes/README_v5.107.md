# v5.107 Class & Background Certification Mega

## Kurulum

ZIP içeriğini proje köküne çıkarın:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CLASS_BACKGROUND_CERTIFICATION_v5.107.ps1
```

Bu komut oracle testlerini, production build'i ve rapor üretimini çalıştırır.

## Büyük tarayıcı testi

```powershell
npm.cmd run certify:class-background:e2e
```

## Tam release zinciri

```powershell
npm.cmd run certify:class-background:release
```

Tahmini kapsam:
- 12 class × 2 ruleset
- 12 adet 2014 background
- 16 adet 2024 background
- desktop + mobile
- yaklaşık 104 Playwright testi
