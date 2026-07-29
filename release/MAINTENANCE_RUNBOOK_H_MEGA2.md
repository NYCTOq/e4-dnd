# H-MEGA2 Maintenance Runbook

1. Preserve the user's current save before making changes.
2. Record the app version and save schema version.
3. Run hydration, integrity and backup-recovery tests.
4. Compare release/cache state with user-save state.
5. Restore from the untouched backup when migration or hydration fails.
6. Clear only versioned cache and service-worker state.
7. Never clear user save storage during a cache repair.
8. Rebuild and run browser smoke after maintenance.
9. Re-run post-release QA and the final release gate.
10. Generate a fresh maintenance snapshot.
