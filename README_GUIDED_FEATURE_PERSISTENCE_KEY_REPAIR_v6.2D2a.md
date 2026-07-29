# E4 D&D v6.2D2a Persistence Key Collision Repair

The v6.2D2 matrix found 581 subclass features but only 580 unique persistence keys.

Cause:

- at least one subclass contains duplicate feature names
- the original key used only ruleset, subclass id and feature name

Repair:

- adds feature level to the persistence key
- adds the feature's stable array index
- preserves ruleset, subclass and feature-name identity
- reruns the complete v6.2D2 automation wave
- reruns the full unit/integration suite
- reruns the production build

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_GUIDED_FEATURE_PERSISTENCE_KEY_REPAIR_v6.2D2a.ps1
```
