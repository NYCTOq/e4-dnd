# E4 D&D G-MEGA2 Production Deployment & Golden Release Closure

Coverage:

- complete E/F/G mega regression
- stable/public/final release gates
- packaging and rollback
- offline/PWA distribution
- bundle and chunk performance
- full unit/integration suite
- clean production build
- `dist/index.html`, manifest and service worker
- SHA-256 asset manifest
- desktop/mobile Playwright smoke
- post-build regression
- final release artifact count verification

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PRODUCTION_GOLDEN_RELEASE_G_MEGA2.ps1
```
