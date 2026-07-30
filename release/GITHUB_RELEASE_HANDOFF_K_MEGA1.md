# K-MEGA1 GitHub Release Handoff

Recommended commands after K-MEGA1 is green:

```powershell
git status
git add package.json src/certification/player-readiness release scripts deployment
git commit -m "release: publish e4 dnd 6.2.0"
git tag -a v6.2.0 -m "E4 D&D 6.2.0"
git push origin HEAD
git push origin v6.2.0
```

Create the GitHub release from tag `v6.2.0` and attach:

- public deployment archive
- public release notes
- public release archive manifest
- rollback runbook
