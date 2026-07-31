E4 DND N-MEGA13 SPELL ABILITY FIX AND ANCESTRY AUDIT

This package:
- Fixes default spellcasting ability inference centrally.
- Wizard uses INT.
- Bard, Sorcerer, Warlock and Paladin use CHA.
- Cleric, Druid and Ranger use WIS.
- Explicit ability overrides remain supported.
- Unknown/homebrew classes keep the previous WIS fallback.
- Adds focused unit tests.
- Generates certification-reports/n-mega13/ANCESTRY_RUNTIME_COVERAGE_AUDIT.json.
- Runs build after tests and audit.

Run:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA13.ps1

Success:
N-MEGA13 SPELL ABILITY AND ANCESTRY AUDIT GREEN
