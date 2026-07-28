# E4 D&D v5.136 Full Regression & Release Candidate

This is the planned stop-point package.

It:
- normalizes all `src/index.css` imports to the top of the file,
- runs the complete Vitest suite,
- builds the production application,
- audits release artifact size,
- runs critical desktop/mobile Playwright flows,
- writes `reports/FULL_REGRESSION_RELEASE_CANDIDATE_v5.136.md`.

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_FULL_REGRESSION_RELEASE_CANDIDATE_v5.136.ps1
```
