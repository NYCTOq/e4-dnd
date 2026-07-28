# E4 D&D v5.121D1 - Cross-Domain UI E2E Determinism Hotfix

This hotfix makes the v5.121D Playwright suite deterministic without bypassing
application behavior:

- marks the current release notes version as already seen in the known E2E state,
- clears each browser context storage before seeding fixtures,
- activates hidden mobile builder steps through their native DOM click path,
- tolerates transient storage reads while the application commits persistence,
- uses the canonical inventory and resource record shapes.

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CROSS_DOMAIN_UI_E2E_DETERMINISM_HOTFIX_v5.121D1.ps1
```
