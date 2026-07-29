# G-MEGA1 Rollback Plan

1. Preserve the current user save before migration.
2. Keep the previous schema payload unchanged as a recovery artifact.
3. Run hydration and backup-recovery validation.
4. Restore the pre-migration payload if migration validation fails.
5. Clear only versioned application cache, never user save storage.
6. Re-run release and post-release gates after rollback.
