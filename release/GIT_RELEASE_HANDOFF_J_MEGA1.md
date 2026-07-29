# J-MEGA1 Git Release Handoff

Recommended commands after the package is green:

```powershell
git status
git add package.json src/certification/player-readiness release scripts e2e
git commit -m "release: prepare e4 dnd 6.2.0 rc1"
git tag -a v6.2.0-rc.1 -m "E4 D&D 6.2.0 RC1"
git push origin HEAD
git push origin v6.2.0-rc.1
```

Before publishing:

1. Confirm the working tree contains only intended release files.
2. Keep generated reports and release metadata.
3. Do not commit `node_modules`, `test-results`, Playwright traces or local caches.
4. Confirm `dist` policy before committing generated build output.
5. Preserve the pre-release backup and rollback plan.
