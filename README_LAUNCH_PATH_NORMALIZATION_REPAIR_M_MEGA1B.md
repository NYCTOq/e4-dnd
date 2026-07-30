# E4 D&D M-MEGA1b Launch Path Normalization Repair

The previous hotfix produced an invalid PowerShell expression:

```powershell
.Replace("", "/")
```

PowerShell cannot replace an empty string, so the launch script stopped before Git verification.

This repair:

- replaces the broken expression with regex-based path normalization
- safely converts backslashes to forward slashes
- allows the M-MEGA1a and M-MEGA1b hotfix files
- still blocks unrelated uncommitted project changes
- reruns the complete final distribution and launch closure

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_LAUNCH_PATH_NORMALIZATION_REPAIR_M_MEGA1B.ps1
```
