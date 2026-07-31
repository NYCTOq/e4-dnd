E4 DND N-MEGA17 HOTFIX1

Problem:
APPLY_N_MEGA17.ps1 was run a second time.
The first run had already replaced the target blocks, so the original
text could no longer be found.

Fix:
Makes Replace-Exact idempotent:
- If the updated block already exists, it skips that change.
- If the original block exists, it applies the change.
- It only fails when neither version exists.

The hotfix automatically reruns N-MEGA17 validation.

Run:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA17_HOTFIX1.ps1

Success:
N-MEGA17 ZERO-WARNING CLOSURE GREEN
N-MEGA17 HOTFIX1 GREEN
