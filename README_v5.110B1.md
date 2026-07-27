# v5.110B1 Equipment & Combat Import Hotfix

## Sorun

Differential test şu mevcut olmayan dosyayı import ediyordu:

```text
src/features/character/CharacterEditor
```

Gerçek runtime fonksiyonları şu dosyada:

```text
src/features/characters/characterShared.tsx
```

## Düzeltme

Import yolu şu şekilde değiştirilir:

```ts
../../features/characters/characterShared
```

Uygulama runtime kodu değiştirilmez.

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_IMPORT_HOTFIX_v5.110B1.ps1
```
