# v5.98 Direct Path Final Hotfix

Bu ZIP dış paket klasörü içermez.

Doğrudan proje köküne açıldığında şu dosyanın üstüne yazar:

`src/core/rulesets/inventoryEconomyRuntime.test.ts`

Beklenen içerik:

- `cost: "0 gp"`
- `description: ""`
- duplicate stack testinde `toMatchObject(...)`

Doğrulama:

```powershell
npm.cmd run verify:inventory
```
