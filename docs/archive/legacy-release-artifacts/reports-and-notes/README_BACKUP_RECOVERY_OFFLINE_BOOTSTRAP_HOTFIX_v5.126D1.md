# E4 D&D v5.126D1

Offline E2E bootstrap hotfix.

The backup page is now loaded while the local preview server is reachable. The browser context is switched offline only after the recovery center has rendered, matching real PWA usage.

## Apply

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_BACKUP_RECOVERY_OFFLINE_BOOTSTRAP_HOTFIX_v5.126D1.ps1
```
