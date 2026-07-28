# E4 D&D v5.141 Dependency & Security Hardening

This package refreshes installed dependencies only inside the semver ranges already declared by the project. It does not run `npm audit fix --force` and does not automatically accept breaking major upgrades.

## What it does

- Backs up `package.json` and `package-lock.json` under `reports/dependency-backup-v5.141`.
- Writes `package.json` as UTF-8 without BOM.
- Runs `npm install` and `npm update --save=false`.
- Audits the full dependency tree and the production-only tree separately.
- Produces Markdown and JSON security reports.
- Fails the gate when production dependencies contain high or critical vulnerabilities.
- Runs the existing `test:critical` command and production build after the security gate.

## Apply

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_DEPENDENCY_SECURITY_HARDENING_v5.141.ps1
```

## Reports

- `reports/DEPENDENCY_SECURITY_HARDENING_v5.141.md`
- `reports/DEPENDENCY_SECURITY_HARDENING_v5.141.json`

A failed production security gate is intentional. Review the report instead of using `npm audit fix --force`, which may upgrade or remove packages in breaking ways.
