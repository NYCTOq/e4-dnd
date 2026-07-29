# E4 D&D v6.2B1a Feature Shape Repair

Repairs the v6.2B1 certification so class features may be represented as:

- plain strings
- objects with a `name` field
- unknown legacy entries

The repair then reruns the complete v6.2B1 package:

- four-class readiness certification
- targeted class certification suites
- full unit/integration suite
- production build

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FOUR_CLASS_FEATURE_SHAPE_REPAIR_v6.2B1a.ps1
```
