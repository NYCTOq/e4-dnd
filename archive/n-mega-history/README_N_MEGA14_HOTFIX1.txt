E4 DND N-MEGA14 HOTFIX1

Fix:
- Changes the partial Character test fixture cast from:
  as Character
  to:
  as unknown as Character

Reason:
- Vitest accepted the fixture at runtime.
- TypeScript build correctly rejected the incomplete object shape.

Run:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA14_HOTFIX1.ps1

Success:
N-MEGA14 HOTFIX1 GREEN
