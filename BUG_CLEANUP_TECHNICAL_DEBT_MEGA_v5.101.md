# E4 D&D v5.101 — Bug Cleanup & Technical Debt Mega Pack

## Kapatılan gerçek teknik borçlar

- E2E onboarding hazırlığı tek `appState` helper'ına taşındı.
- Combat E2E rotası kalıcı olarak `/combat` yapıldı.
- Inventory item fixture'ları typed factory kullanıyor.
- `DndItemData[]` zorlayıcı cast kaldırıldı.
- Inventory normalize testi canonical alanlara dayanıklı hale getirildi.
- Son dört büyük sistem için ortak stability E2E zinciri eklendi.
- Aynı hataların geri dönmesini engelleyen teknik borç audit script'i eklendi.

## Doğrulama

```powershell
npm.cmd install
npm.cmd run verify:technical-debt
```

Yalnız audit:

```powershell
npm.cmd run audit:technical-debt
```
