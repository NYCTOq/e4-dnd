# v5.110B3 Equipment & Combat Weight Matrix Hotfix

## Kök neden

Vitest `it.each` içindeki her alt diziyi callback argümanlarına yayar.

Örneğin:

```ts
[]
```

callback'e hiç argüman göndermez.

```ts
[entry]
```

callback'e doğrudan `entry` gönderir; inventory dizisini değil.

## Düzeltme

Weight callback'i rest parameter kullanacak şekilde değiştirilir:

```ts
(...inventory) => {
  getInventoryWeight(inventory, items);
}
```

Böylece her senaryo tekrar gerçek inventory dizisine dönüşür.

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_WEIGHT_MATRIX_HOTFIX_v5.110B3.ps1
```

Uygulama runtime koduna dokunulmaz.
