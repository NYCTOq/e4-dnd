# v5.110B5 Equipment & Combat Build Type Hotfix

## Sorun

Differential test fixture'ında üretilen `DndItemData` nesnesinde zorunlu
`cost` alanı yoktu. Vitest testleri geçti ancak TypeScript build durdu.

## Düzeltme

Fixture item nesnesine şu alan eklenir:

```ts
cost: "0 gp"
```

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_BUILD_TYPE_HOTFIX_v5.110B5.ps1
```

Uygulama runtime kodu değiştirilmez.
