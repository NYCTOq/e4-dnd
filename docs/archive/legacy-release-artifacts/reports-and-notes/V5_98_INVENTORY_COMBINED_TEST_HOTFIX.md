# v5.98 Inventory Combined Test Hotfix

Bu paket önceki iki test düzeltmesini tek dosyada birleştirir.

Korunan fixture alanları:

- `cost: 0`
- `description: ""`

Korunan expectation düzeltmesi:

- `toEqual(...)` yerine `toMatchObject(...)`

Doğrulama:

```powershell
npm.cmd run verify:inventory
```
