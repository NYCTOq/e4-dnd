# v5.128D1 Windows Release Gate Spawn Hotfix

Fixes the Windows Node child-process bootstrap failure in `scripts/run-release-gate-v5.128.mjs`.

## Root cause

`spawnSync("npm.cmd", args, { shell: false })` can fail before process startup on Windows with an `EINVAL`-style spawn error. The previous runner did not print `result.error`, so the certification exited silently.

## Changes

- Uses the Windows command shell only on Windows.
- Prints the current release-gate step before execution.
- Prints spawn errors, termination signals, and exit codes.
- Keeps inherited stdout/stderr for all child npm commands.
- Does not change production application code.

## Apply

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_RELEASE_GATE_WINDOWS_SPAWN_HOTFIX_v5.128D1.ps1
```
