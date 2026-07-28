# E4 D&D v5.123B3a

This hotfix replaces only the faulty PowerShell apply script from v5.123B3.

The original script resolved its own location as the project root after extraction and attempted to copy project files onto themselves. This version performs no redundant Copy-Item operations. It verifies that the v5.123B3 files already exist, then runs install and the navigation/search parity certification.

Run from the project root:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_SEARCH_ALIAS_DISCOVERY_GAP_HOTFIX_v5.123B3a.ps1
```
