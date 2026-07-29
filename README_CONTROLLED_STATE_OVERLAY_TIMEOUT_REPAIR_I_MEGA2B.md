# E4 D&D I-MEGA2b Controlled State, Overlay and Route Timeout Repair

The previous targeted run produced 22 passing tests and 8 failures.

Root causes:

1. The ruleset select is controlled by application state and can normalize back to `dnd_2014`.
2. The first-run guide overlay intercepted physical pointer actions.
3. Eight route navigations plus eight reloads exceeded Playwright's default 30-second test timeout.

This repair:

- dismisses the first-run overlay through its own dialog
- accepts valid controlled-select normalization
- targets buttons inside main/form content instead of global navigation
- performs only one final route refresh
- raises the route-matrix timeout to 90 seconds
- reruns the targeted browser matrix
- reruns the complete I-MEGA2 closure

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_CONTROLLED_STATE_OVERLAY_TIMEOUT_REPAIR_I_MEGA2B.ps1
```
