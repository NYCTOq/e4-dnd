E4 DND N-MEGA16 HOTFIX1

Fix:
PowerShell treated npm notice output written to stderr as NativeCommandError
because the main script uses ErrorActionPreference=Stop.

This hotfix changes lint capture to:
- run npm through cmd.exe
- redirect stdout and stderr to a temporary file
- preserve the real process exit code
- print and archive the captured lint output normally

The hotfix automatically reruns APPLY_N_MEGA16.ps1.

Run:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA16_HOTFIX1.ps1

Success:
N-MEGA16 RELEASE CANDIDATE GREEN
N-MEGA16 HOTFIX1 GREEN
