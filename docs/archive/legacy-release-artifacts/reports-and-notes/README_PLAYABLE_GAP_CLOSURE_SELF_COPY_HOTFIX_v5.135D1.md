# E4 D&D v5.135D1 — Playable Gap Closure Self-Copy Hotfix

This hotfix removes the Python-free package's self-copy failure when the ZIP contents are extracted directly into the project root.

## Apply

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PLAYABLE_GAP_CLOSURE_SELF_COPY_HOTFIX_v5.135D1.ps1
```

The script keeps files that are already in the project, restores only genuinely missing files when package copies exist, updates the version to `5.135.1`, then runs the v5.135 targeted tests and production build.
