# v5.98 Inventory Fixture Type Hotfix

Bu hotfix yalnız `inventoryEconomyRuntime.test.ts` içindeki sahte item kayıtlarını günceller.

Eklenen zorunlu alanlar:

- `cost: 0`
- `description: ""`

Doğrulama:

```powershell
npm.cmd run verify:inventory
```
