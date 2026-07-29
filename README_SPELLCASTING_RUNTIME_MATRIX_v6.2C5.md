# E4 D&D v6.2C5 Spellcasting Runtime Matrix

This package certifies spellcasting as an actual player runtime rather than a catalog list.

Coverage:

- D&D 2014 and D&D 2024
- Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock and Wizard
- levels 1, 5, 11 and 17
- 64 generated spellcasting scenarios
- class spell-list membership
- spell-level eligibility
- casting metadata
- prepared / known / half-caster / Pact Magic eligibility
- cantrip coverage
- attack and saving throw spells
- concentration
- ritual casting
- healing
- summon and persistent effects
- spell persistence
- targeted runtime and differential suites
- full unit/integration suite
- production build

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELLCASTING_RUNTIME_MATRIX_v6.2C5.ps1
```

Reports:

- `reports/SPELLCASTING_RUNTIME_MATRIX_v6.2C5.json`
- `reports/SPELLCASTING_RUNTIME_MATRIX_v6.2C5.md`
