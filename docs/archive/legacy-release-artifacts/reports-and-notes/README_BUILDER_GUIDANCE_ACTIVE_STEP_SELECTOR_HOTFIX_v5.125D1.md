# E4 D&D v5.125D1 Builder Guidance Active Step Selector Hotfix

Fixes the Playwright strict-mode collision in the draft recovery E2E test.

The test now targets the canonical active-step heading by its stable DOM id:

`#builder-active-step-title`

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_BUILDER_GUIDANCE_ACTIVE_STEP_SELECTOR_HOTFIX_v5.125D1.ps1
```
