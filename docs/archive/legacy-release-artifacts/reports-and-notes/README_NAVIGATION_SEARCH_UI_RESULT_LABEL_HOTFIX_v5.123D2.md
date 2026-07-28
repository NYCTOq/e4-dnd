# E4 D&D v5.123D2

Fixes the Global Search E2E expectations to use the real navigation result titles:

- `büyüler` resolves to the `Spellbook` page result.
- `inventory` resolves to the `Inventory` page result.

The centralized aliases remain Turkish/English; only the visible result titles are English because they come from `navItems`.

## Apply

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_NAVIGATION_SEARCH_UI_RESULT_LABEL_HOTFIX_v5.123D2.ps1
```
