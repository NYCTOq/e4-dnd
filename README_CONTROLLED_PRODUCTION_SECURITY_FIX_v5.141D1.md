# E4 D&D v5.141D1 Controlled Production Security Fix

This hotfix addresses the two production audit entries without using `npm audit fix --force`.

## Changes

- Pins `react-router-dom` to `7.11.0`, below the affected `>=7.12.0` advisory range.
- Pins a direct `react-router` dependency too, when present.
- Moves `vite-plugin-pwa` to `devDependencies`, where a build-time plugin belongs.
- Runs production-only audit, critical tests, and production build.
- Writes a UTF-8 report to `reports/CONTROLLED_PRODUCTION_SECURITY_FIX_v5.141D1.md`.

## Run

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_CONTROLLED_PRODUCTION_SECURITY_FIX_v5.141D1.ps1
```
