# v5.110B2 Equipment & Combat Dynamic Import Hotfix

Bu hotfix `getLevelOneCombatReadiness` fonksiyonunun bulunduğu gerçek
TypeScript dosyasını proje içinde otomatik arar ve differential testteki
yanlış import yolunu düzeltir.

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_DYNAMIC_IMPORT_HOTFIX_v5.110B2.ps1
```

Uygulama runtime kodu değiştirilmez.
