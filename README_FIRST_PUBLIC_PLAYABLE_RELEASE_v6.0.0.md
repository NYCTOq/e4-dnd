# E4 D&D v6.0.0 First Public Playable Release

Extract the contents of this patch folder into the project root and run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FIRST_PUBLIC_PLAYABLE_RELEASE_v6.0.0.ps1
```

The script runs the public-release unit gate, context-aware production security gate, critical regression tests, production build, bundle budget and final public packaging.

Expected artifacts:

- `release/E4_DND_v6.0.0_PUBLIC/`
- `release/E4_DND_v6.0.0_PUBLIC.zip`
- `release/E4_DND_v6.0.0_PUBLIC.zip.sha256`
- `reports/FIRST_PUBLIC_PLAYABLE_RELEASE_v6.0.0.md`
