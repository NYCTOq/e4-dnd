# E4 D&D v6.2D10 Post-Build Offline Install Closure

This package validates the generated production output after a clean build.

Coverage:

- package and build identity
- Vite configuration
- PWA manifest source
- service-worker registration path
- D8-D9 release regression
- navigation and route fallback
- backup and install recovery
- bundle and chunk performance
- clean production build
- dist/index.html verification
- compiled JS/CSS asset verification
- generated-dist smoke inspection
- full unit/integration suite

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_POST_BUILD_OFFLINE_INSTALL_CLOSURE_v6.2D10.ps1
```

Reports:

- `reports/POST_BUILD_OFFLINE_INSTALL_CLOSURE_v6.2D10.json`
- `reports/POST_BUILD_OFFLINE_INSTALL_CLOSURE_v6.2D10.md`
