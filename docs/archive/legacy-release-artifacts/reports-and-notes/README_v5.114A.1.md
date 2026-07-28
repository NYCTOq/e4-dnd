# v5.114A.1 Level-Up Multiclass Record Type Hotfix

## Kök neden

TypeScript, farklı property kombinasyonlarına sahip multiclass örneklerini union
olarak çıkardı. Bu union, `Record<string, number>` parametresine aktarılırken
opsiyonel property'leri `undefined` kabul ettiği için build durdu.

## Düzeltme

Test verisi açıkça şu tipe bağlandı:

```ts
Array<Record<string, number>>
```

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_LEVEL_UP_MULTICLASS_RECORD_TYPE_HOTFIX_v5.114A_1.ps1
```
