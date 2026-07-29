# E4 D&D J-MEGA1 Version Bump, Release Candidate & Git Handoff

Coverage:

- package version bump to `6.2.0`
- release-candidate metadata
- save schema version `2`
- compatibility floor `6.1.0`
- release notes and changelog
- Git tag handoff for `v6.2.0-rc.1`
- final acceptance and interaction regression
- operations, recovery and migration regression
- full unit/integration suite
- clean production build
- final Playwright acceptance
- SHA-256 release-candidate bundle
- final release gate

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_VERSION_BUMP_RELEASE_CANDIDATE_J_MEGA1.ps1
```
