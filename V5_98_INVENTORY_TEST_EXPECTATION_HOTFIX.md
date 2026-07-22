# v5.98 Inventory Test Expectation Hotfix

Bu hotfix yalnız `inventoryEconomyRuntime.test.ts` içindeki duplicate stack testini düzeltir.

Runtime normalize edilen stack'e şu canonical alanları ekler:

- `attuned: undefined`
- `chargesUsed: 0`

Test artık tam obje eşitliği yerine gerekli alanları doğrular:

```ts
toMatchObject([{ itemId: "arrow", quantity: 12 }])
```

Doğrulama:

```powershell
npm.cmd run verify:inventory
```
