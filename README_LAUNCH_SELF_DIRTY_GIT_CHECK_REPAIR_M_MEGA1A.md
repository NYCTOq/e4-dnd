# E4 D&D M-MEGA1a Launch Self-Dirty Git Check Repair

M-MEGA1 was extracted into the project root. Its own scripts and runbooks therefore appeared as untracked files, causing the launch script's strict clean-working-tree check to stop immediately.

This repair:

- allows only the known M-MEGA1 launch files
- still blocks unrelated source or project changes
- keeps local and remote `v6.2.0` verification
- reruns the complete final distribution and launch closure

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_LAUNCH_SELF_DIRTY_GIT_CHECK_REPAIR_M_MEGA1A.ps1
```
