# K-MEGA1 Public Rollback Runbook

1. Preserve current user saves and exported backups.
2. Restore the previous deployment folder.
3. Restore the previous index, manifest and service worker together.
4. Do not clear localStorage or user-save storage.
5. Clear only app-owned Cache Storage when needed.
6. Confirm deep-route refresh behavior.
7. Confirm character hydration and reload persistence.
8. Re-run live smoke.
9. Record the rollback reason and affected version.
