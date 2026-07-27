# v5.104 Builder Syntax Repair Hotfix

Bu hotfix, ancestry mega patch script'inin `Builder.tsx` içinde bozduğu iki object reset satırını düzeltir.

Düzeltilen alanlar:

- Ruleset değişimindeki draft reset object'i
- Race değişimindeki ancestry reset object'i

Mevcut ancestry/species seçimleri korunur.

## Uygulama

ZIP içeriğini proje köküne kopyalayın:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_V5_104_BUILDER_SYNTAX_REPAIR.ps1
```
