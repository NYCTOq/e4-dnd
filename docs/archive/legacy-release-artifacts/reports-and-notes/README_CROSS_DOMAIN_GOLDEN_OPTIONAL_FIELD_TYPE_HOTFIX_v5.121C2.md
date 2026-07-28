# E4 D&D v5.121C2 - Golden Optional Field Type Hotfix

This hotfix narrows optional `level` and `currentHp` fields before arithmetic and
comparison. Runtime behavior is unchanged; the fix only makes the golden lifecycle
certification compatible with the canonical optional character interfaces used by
the project TypeScript build.

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CROSS_DOMAIN_GOLDEN_OPTIONAL_FIELD_TYPE_HOTFIX_v5.121C2.ps1
```
