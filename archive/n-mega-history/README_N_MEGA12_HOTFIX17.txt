E4 DND N-MEGA12 HOTFIX17

This package uses an ASCII-only PowerShell script.

It:
- Fixes mojibake strings in src/features/play-mode/PlayMode.tsx using Unicode code points.
- Verifies no targeted broken strings remain.
- Runs npm.cmd run build.
- Runs the four play-feedback desktop/mobile tests.

Command:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA12_HOTFIX17.ps1
