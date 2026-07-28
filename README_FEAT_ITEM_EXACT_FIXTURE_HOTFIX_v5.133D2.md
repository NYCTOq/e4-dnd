# E4 D&D v5.133D2 — Feat & Item Exact Fixture Hotfix

Fixes the v5.133 test fixture so it exactly satisfies the current `DndItemData` interface.

Removed unsupported properties:
- `ruleset`
- `costGp`

Retained required and runtime-relevant properties:
- `id`, `name`, `category`, `cost`, `weight`, `description`
- `rarity`, `charges`, `chargeCost`, `requiresAttunement`

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_FEAT_ITEM_EXACT_FIXTURE_HOTFIX_v5.133D2.ps1
```
