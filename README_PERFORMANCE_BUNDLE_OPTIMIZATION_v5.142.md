# E4 D&D v5.142 — Performance & Bundle Optimization

## Purpose

This package removes the manually forced `shell` chunk, separates React Router from the React core cache layer, and adds a repeatable production bundle budget.

## Changes

- Removes `PageShell` / `AppFrame` forced `shell` chunking.
- Splits `vendor-react` and `vendor-router` for more stable browser caching.
- Disables the legacy module-preload polyfill for modern target browsers.
- Keeps CSS code splitting enabled and lowers the Vite chunk warning threshold to 400 KiB.
- Adds a dist analyzer and machine-readable performance report.
- Blocks regression if the legacy shell chunk returns or entry/CSS/precache budgets are exceeded.

## Apply

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PERFORMANCE_BUNDLE_OPTIMIZATION_v5.142.ps1
```

## Reports

- `reports/PERFORMANCE_BUNDLE_OPTIMIZATION_v5.142.md`
- `reports/PERFORMANCE_BUNDLE_OPTIMIZATION_v5.142.json`

## Certification

1. Four targeted Vitest checks.
2. TypeScript and Vite production build.
3. Bundle and PWA precache budget audit.
