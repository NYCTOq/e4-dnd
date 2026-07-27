# v5.114C.1 Level-Up Adapter Type Narrowing Hotfix

## Düzeltilen hatalar

- `normalized.level` possibly undefined
- `previousLevel` number | undefined
- runtime class type üzerinde `subclassId` görünmemesi
- history entry `fromLevel` tip hatası

## Etki

- Runtime davranışı değişmez.
- Level-up kuralları değişmez.
- ASI, feat, subclass ve HP davranışı değişmez.
- Yalnızca adapter içindeki TypeScript narrowing kesinleştirilir.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_LEVEL_UP_ADAPTER_TYPE_NARROWING_HOTFIX_v5.114C_1.ps1
```
