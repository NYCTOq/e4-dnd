E4 DND N-MEGA17 ZERO-WARNING CLOSURE

This package addresses all 41 lint warnings reported by N-MEGA16.

Runtime-relevant fixes:
- Adds the missing spellcastingProfile.spellListClass dependency.
- Uses the complete draft dependency for multiclass spellcasting-class resolution.
- Memoizes character.classes in LevelUpRuntimePanel.
- Replaces unsafe optional-chain dereference in persistence certification.

Fast Refresh advisories:
Several files intentionally export a component/provider together with its
public hooks, constants or pure helpers. The package adds narrow file-level
react/only-export-components exceptions instead of splitting stable public
modules solely to satisfy development-only Fast Refresh advice.

Validation:
- Requires 0 lint warnings and 0 lint errors.
- Runs full unit/integration tests.
- Runs production build.
- Generates certification-reports/n-mega17/N_MEGA17_WARNING_CLOSURE.json

Run:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA17.ps1

Success:
N-MEGA17 ZERO-WARNING CLOSURE GREEN
