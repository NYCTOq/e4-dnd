# K-MEGA2 Hotfix Channel Runbook

## Hotfix rules

1. Branch from tag `v6.2.0`.
2. Change only the smallest required scope.
3. Never delete or reset user save storage.
4. Keep save schema `2` unless a tested migration is included.
5. Run targeted regression first.
6. Run the full test suite and production build.
7. Regenerate deployment hashes.
8. Compare against the K-MEGA2 post-release baseline.
9. Publish as `6.2.1` when code changes reach users.
10. Keep the `6.2.0` package available for rollback.

## Suggested Git flow

```powershell
git checkout -b hotfix/6.2.1 v6.2.0
git add .
git commit -m "fix: describe the production issue"
git tag -a v6.2.1 -m "E4 D&D 6.2.1"
git push origin HEAD
git push origin v6.2.1
```
