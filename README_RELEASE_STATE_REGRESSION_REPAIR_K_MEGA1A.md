# E4 D&D K-MEGA1a Release State Regression Repair

K-MEGA1 successfully promoted the project to:

- version `6.2.0`
- channel `public-release`
- release ID `K-MEGA1`
- Git tag `v6.2.0`

The run then failed because two older certification tests still required:

- channel `release-candidate`
- release ID `J-MEGA1`

Those assertions were correct during RC preparation but became stale after final promotion.

This repair updates the old J-MEGA1 and J-MEGA2 tests to accept both lifecycle states:

- `release-candidate` / `J-MEGA1`
- `public-release` / `K-MEGA1`

The version, save schema and compatibility floor remain strictly validated.

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_RELEASE_STATE_REGRESSION_REPAIR_K_MEGA1A.ps1
```
