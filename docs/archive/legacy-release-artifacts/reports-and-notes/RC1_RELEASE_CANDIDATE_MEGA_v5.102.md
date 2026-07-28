# E4 D&D v5.102 RC1 — Release Candidate Mega Pack

## Amaç

v5.93-v5.101 arasında tamamlanan ana sistemleri tek release candidate kalite kapısında birleştirir.

## Eklenenler

- RC1 release manifestosu
- package.json / package-lock / manifesto sürüm tutarlılığı denetimi
- Zorunlu release script ve artifact kontrolü
- Altı kritik rota için Playwright smoke testi
- Sayfa navigasyonu boyunca uncaught browser error denetimi
- RC1 manuel release checklist
- Tek komutluk RC doğrulama zinciri

## Doğrulama

```powershell
npm.cmd install
npm.cmd run verify:rc1
```

Yalnız release metadatası:

```powershell
npm.cmd run audit:rc
```

Yalnız kritik rotalar:

```powershell
npm.cmd run test:e2e:rc1
```

RC1 testleri geçmeden RC2 veya stable sürüme terfi edilmemelidir.
