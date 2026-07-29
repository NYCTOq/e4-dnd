# E4 D&D v6.2C7a Epic Boon Ruleset Repair

The v6.2C7 matrix incorrectly required Epic Boon eligibility for D&D 2014 characters at levels 19 and 20.

This repair makes Epic Boon certification ruleset-aware:

- D&D 2014: no Epic Boon requirement
- D&D 2024: Epic Boon remains required at the appropriate high-level checkpoints

The script then reruns the complete v6.2C7 package, including:

- 168 origin and feat scenarios
- ancestry and origin suites
- background and proficiency suites
- feat, ASI and high-level advancement suites
- full unit/integration suite
- production build

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_ORIGIN_FEAT_EPIC_BOON_REPAIR_v6.2C7a.ps1
```
