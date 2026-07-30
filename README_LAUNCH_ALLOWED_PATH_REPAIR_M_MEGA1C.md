# E4 D&D M-MEGA1c Launch Allowed Path Repair

The previous repair fixed normalization for the Git status path, but the allow-list side still contained an invalid expression:

```powershell
$allowed.Replace("", "/")
```

This repair normalizes both sides with the same regex expression:

```powershell
-replace '\\', '/'
```

It also adds the M-MEGA1c files to the allow-list and reruns the complete final distribution closure.

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_LAUNCH_ALLOWED_PATH_REPAIR_M_MEGA1C.ps1
```
