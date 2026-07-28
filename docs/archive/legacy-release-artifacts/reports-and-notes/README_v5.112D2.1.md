# v5.112D2.1 Class Feature Panel Type Narrowing Hotfix

## Kök neden

TypeScript, `hasUses` boolean kontrolünden sonra aşağıdaki alanları kesin sayı
olarak daraltmadı:

```ts
feature.currentUses
feature.maxUses
```

Bu nedenle üç adet `TS18048` build hatası oluştu.

## Düzeltme

Alanlar önce açıkça `number | null` yerel değişkenlere dönüştürülür:

```ts
const currentUses =
  typeof feature.currentUses === "number"
    ? feature.currentUses
    : null;

const maxUses =
  typeof feature.maxUses === "number"
    ? feature.maxUses
    : null;
```

Butonların `disabled` kontrolleri bu yerel değerlerle yapılır.

## Etki

- Runtime davranışı değişmez.
- Persistence davranışı değişmez.
- UI görünümü değişmez.
- Yalnızca TypeScript tip güvenliği düzeltilir.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CLASS_FEATURE_PANEL_TYPE_NARROWING_HOTFIX_v5.112D2_1.ps1
```
