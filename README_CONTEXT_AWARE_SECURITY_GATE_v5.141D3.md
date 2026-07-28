# E4 D&D v5.141D3 Context-Aware Security Gate

This hotfix keeps React Router 7.18.1 and replaces the naive “any npm audit high means fail” rule with a strict contextual gate.

The gate:
- runs `npm audit --omit=dev --json`;
- scans source/config files for React Router unstable RSC APIs and `@vitejs/plugin-rsc`;
- accepts only GHSA-qwww-vcr4-c8h2 when the repository has no RSC usage;
- blocks every other production high/critical vulnerability;
- runs critical tests and production build after the security decision;
- writes Markdown and JSON evidence under `reports/`.

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_CONTEXT_AWARE_SECURITY_GATE_v5.141D3.ps1
```
