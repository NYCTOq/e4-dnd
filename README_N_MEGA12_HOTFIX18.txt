E4 DND N-MEGA12 HOTFIX18

Root cause:
- The remaining mojibake string used Unicode U+0178 for the visible Y-diaeresis character.
- HOTFIX17 searched for code point 159, so the healing label was not matched.

This package:
- Replaces the exact broken healing label in PlayMode.tsx.
- Writes UTF-8 without BOM.
- Rebuilds dist.
- Runs all four play-feedback tests.

Command:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA12_HOTFIX18.ps1
