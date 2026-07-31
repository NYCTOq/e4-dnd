E4 DND N-MEGA16 RELEASE CANDIDATE

Purpose:
- Capture lint output without pretending warnings are errors.
- Require zero lint errors.
- Run the complete unit/integration suite.
- Create a clean production build.
- Package the dist directory as a deployable ZIP.
- Generate a SHA-256 checksum.
- Generate a release manifest with version, commit, file count and sizes.

Outputs:
release/n-mega16/e4-dnd-v<version>-web.zip
release/n-mega16/e4-dnd-v<version>-web.zip.sha256
release/n-mega16/N_MEGA16_RELEASE_MANIFEST.json
certification-reports/n-mega16/N_MEGA16_LINT_OUTPUT.txt

Run:
powershell -ExecutionPolicy Bypass -File .\APPLY_N_MEGA16.ps1

Success:
N-MEGA16 RELEASE CANDIDATE GREEN
