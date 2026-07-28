# E4 D&D v5.103 RC2 — Regression & Packaging Mega Pack

## Amaç

RC1 kalite kapılarını gerçek release provasıyla genişletir. Kritik rotalar, çapraz özellik geçişleri, tarayıcı hataları ve build çıktıları aynı RC2 zincirinde doğrulanır.

## Eklenenler

- RC2 release manifestosu
- Çapraz özellik Playwright regresyon matrisi
- Browser `pageerror` ve console error taraması
- Build artifact SHA-256 checksum üretimi
- RC2 metadata ve dosya bütünlüğü auditi
- RC2 release checklist
- Tek komutluk RC2 doğrulama zinciri

## Doğrulama

```powershell
npm.cmd install
npm.cmd run verify:rc2
```

Yalnız RC2 auditi:

```powershell
npm.cmd run audit:rc2
```

Yalnız checksum üretimi:

```powershell
npm.cmd run build
npm.cmd run release:hash
```

Yalnız RC2 E2E:

```powershell
npm.cmd run test:e2e:rc2
```
