# E4 D&D v5.134D1 Session Play Loop PowerShell Hotfix

Removes the accidental Python runtime dependency from the v5.134 installer.

## Fix
- Applies all v5.134 source edits using native Windows PowerShell.
- Verifies required session runtime, test and CSS files exist.
- Uses idempotent anchor checks so rerunning does not duplicate imports, state, UI or CSS.
- Updates package scripts and runs the original targeted test plus production build.

## Run
```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_SESSION_PLAY_LOOP_POWERSHELL_HOTFIX_v5.134D1.ps1
```
