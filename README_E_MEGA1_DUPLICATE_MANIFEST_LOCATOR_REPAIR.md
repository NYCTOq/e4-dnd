# E4 D&D E-MEGA1a Duplicate Manifest Locator Repair

The E-MEGA1 production build passed and generated a valid PWA build, including:

- `dist/manifest.webmanifest`
- `dist/sw.js`
- Workbox output

The browser test failed only because the page contained two identical manifest links and Playwright strict mode expected exactly one element.

This repair:

- accepts one or more manifest links
- verifies at least one manifest link exists
- reads the first valid manifest link
- reruns the complete E-MEGA1 chain
- reruns desktop and mobile Playwright
- reruns full tests and release regression

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_E_MEGA1_DUPLICATE_MANIFEST_LOCATOR_REPAIR.ps1
```
