# J-MEGA2 Rollback Bundle Checklist

- [ ] Preserve previous deployment assets
- [ ] Preserve previous manifest and service worker
- [ ] Preserve current user-save backups
- [ ] Preserve release candidate metadata
- [ ] Preserve SHA-256 deployment manifests
- [ ] Confirm rollback does not delete localStorage
- [ ] Confirm rollback restores app shell routes
- [ ] Re-run hydration and backup-recovery tests
- [ ] Re-run live smoke after rollback
