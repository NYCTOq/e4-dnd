# v5.127D3 Accessibility Test Isolation Hotfix

## Root cause
The mobile accessibility trigger was visible and enabled, but the first-run PWA guide overlay intercepted physical pointer events. The accessibility E2E suite was unintentionally starting in an onboarding state.

## Fix
- Seed the first-run guide as completed before page navigation.
- Seed the current release notes version as already seen.
- Assert that the first-run overlay is absent before accessibility interactions.
- Keep real physical mobile clicking, Escape close, and focus restoration assertions.
- Do not hide overlays with CSS and do not use forced clicks.

## Apply
```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_ACCESSIBILITY_TEST_ISOLATION_HOTFIX_v5.127D3.ps1
```
