# v5.123B3 Search Alias Discovery Gap Hotfix

This hotfix separates three outcomes in the navigation/search alias matrix:

1. Exact-first resolution
2. Ambiguous-but-found resolution
3. Missing alias discovery gaps

The 42 missing aliases are retained as explicit backlog for v5.123C rather than incorrectly treated as ambiguity or silently hidden. Route registry, navigation, global-search page targets and command parity still require zero blockers.

Apply:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_SEARCH_ALIAS_DISCOVERY_GAP_HOTFIX_v5.123B3.ps1
```
