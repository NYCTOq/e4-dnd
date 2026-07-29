# E4 D&D v6.2C2 Player Choice Integrity Matrix

This package certifies player-facing choice validity across both rulesets.

Coverage:

- D&D 2014 and D&D 2024
- all 12 classes
- levels 1, 4, 8, 12, 16 and 19
- 144 generated player-choice scenarios
- race / ancestry selection
- background selection
- feat / ASI slot availability
- feat identity validity
- class spell-list membership
- spell-level ceiling checks
- race/background metadata warnings
- feat catalog integrity
- spell catalog integrity
- targeted ancestry, background, feat and spell suites
- full unit/integration suite
- production build

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PLAYER_CHOICE_INTEGRITY_MATRIX_v6.2C2.ps1
```

Reports:

- `reports/PLAYER_CHOICE_INTEGRITY_MATRIX_v6.2C2.json`
- `reports/PLAYER_CHOICE_INTEGRITY_MATRIX_v6.2C2.md`
