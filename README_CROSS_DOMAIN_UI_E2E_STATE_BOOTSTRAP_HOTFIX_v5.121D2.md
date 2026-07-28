# E4 D&D v5.121D2 - Cross-Domain UI E2E State Bootstrap Hotfix

This hotfix fixes the actual E2E bootstrap contract:

- `installKnownAppState` accepts an optional initial character collection.
- Seeded characters are installed before every document load instead of being
  written after navigation and then erased by the next init script.
- The Builder class step is selected through the shared mobile-toolbar step
  selector, which updates React state correctly on both desktop and mobile.
- Existing tests remain compatible because the default character collection is
  still empty.

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CROSS_DOMAIN_UI_E2E_STATE_BOOTSTRAP_HOTFIX_v5.121D2.ps1
```
