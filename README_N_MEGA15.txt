E4 DND N-MEGA15
REPO CLEANUP AND FINAL CERTIFICATION

This package:
- Moves historical N-MEGA apply/readme/diagnostic helpers to:
  archive/n-mega-history/
- Keeps N-MEGA15 package files in the project root.
- Removes temporary *.nmega*.bak files.
- Adds a stable .gitattributes line-ending policy.
- Extends .gitignore for test reports, temporary files and generated upload folders.
- Generates:
  certification-reports/n-mega15/N_MEGA15_REPO_CLEANUP_FINAL_CERTIFICATION.json
- Runs:
  npm.cmd run lint
  npm.cmd test -- --run
  npm.cmd run build
  npm.cmd exec playwright test -- --workers=4

The script does NOT delete source code, tests, certification reports,
release ZIP files or checksums.

Run:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA15.ps1

Success marker:
N-MEGA15 REPO CLEANUP AND FINAL CERTIFICATION GREEN
