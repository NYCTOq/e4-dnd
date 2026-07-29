# E4 D&D v6.1D2.1 package.json BOM Repair

D2 installerinin Windows PowerShell 5.1 üzerinde `package.json` dosyasını UTF-8 BOM ile yazması nedeniyle Vite, Vitest ve Playwright JSON parse aşamasında çöküyordu.

Bu hotfix:

- `package.json` başındaki görünmez BOM karakterini kaldırır.
- JSON'u BOM'suz UTF-8 olarak yeniden yazar.
- D2 installerini tekrar çalıştırıldığında BOM üretmeyecek şekilde düzeltir.
- Hedefli E2E, unit suite ve production build çalıştırır.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PACKAGE_JSON_BOM_REPAIR_v6.1D2.1.ps1
```
