# v5.110B4 Equipment & Combat Weight Block Rebuild

Önceki hotfix callback metnini tam eşleşmeyle aradığı için mevcut test
biçimini bulamadı.

Bu sürüm:

1. Differential testteki `getInventoryWeight(` çağrısını bulur.
2. Bu çağrının bağlı olduğu `it.each(...)` statement'ını dengeli parantez
   taramasıyla belirler.
3. Weight test bloğunu tamamen kaldırır.
4. Yerine dört açık ve bağımsız test ekler:
   - empty
   - rope
   - rope and longsword
   - armor and shield

Böylece Vitest'in alt dizileri callback argümanlarına yayması tamamen
devre dışı kalır.

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_WEIGHT_BLOCK_REBUILD_v5.110B4.ps1
```

Uygulama runtime koduna dokunulmaz.
