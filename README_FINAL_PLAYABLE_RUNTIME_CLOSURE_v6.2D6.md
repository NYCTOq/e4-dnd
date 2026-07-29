# E4 D&D v6.2D6 Final Playable Runtime Closure

This package verifies that every loaded subclass feature is genuinely usable by a player.

Coverage:

- D&D 2014 and D&D 2024
- every loaded subclass feature
- character-sheet visibility
- Play Mode visibility
- primary runtime action
- automatic / guided / table-ruling resolution
- stable persistence identity
- reload survival
- backup recovery compatibility
- D1-D5 automation regression
- actionability contracts
- persistence and hydration
- final public-release gates
- full unit/integration suite
- production build

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FINAL_PLAYABLE_RUNTIME_CLOSURE_v6.2D6.ps1
```

Reports:

- `reports/FINAL_PLAYABLE_RUNTIME_CLOSURE_v6.2D6.json`
- `reports/FINAL_PLAYABLE_RUNTIME_CLOSURE_v6.2D6.md`
