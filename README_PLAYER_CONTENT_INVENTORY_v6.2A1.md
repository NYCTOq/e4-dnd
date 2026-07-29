# E4 D&D v6.2A1 Player Content Inventory

First package of the content-completeness phase.

It inventories the content actually loaded by the application for D&D 2014 and 2024, including subclass, feat and spell expansion modules. It reports counts, names, subclasses per class, spell distribution, 1-20 progression gaps, duplicate IDs and broken references.

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PLAYER_CONTENT_INVENTORY_v6.2A1.ps1
```

Outputs:

- `reports/PLAYER_CONTENT_INVENTORY_v6.2A1.json`
- `reports/PLAYER_CONTENT_INVENTORY_v6.2A1.md`
