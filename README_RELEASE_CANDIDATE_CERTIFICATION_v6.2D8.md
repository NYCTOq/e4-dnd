# E4 D&D v6.2D8 Release Candidate Certification

This package certifies the project as a release candidate.

Coverage:

- package identity and version
- test and build scripts
- D1-D7 runtime regression
- stable release gates
- public release readiness
- release packaging
- bundle performance budget
- ruleset chunk loading
- accessibility
- Character Hub and navigation UI closure
- backup, transfer and recovery
- full unit/integration suite
- production build

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_RELEASE_CANDIDATE_CERTIFICATION_v6.2D8.ps1
```

Reports:

- `reports/RELEASE_CANDIDATE_CERTIFICATION_v6.2D8.json`
- `reports/RELEASE_CANDIDATE_CERTIFICATION_v6.2D8.md`
