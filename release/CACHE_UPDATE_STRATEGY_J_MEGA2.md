# J-MEGA2 Cache and Service Worker Update Strategy

1. Deploy immutable hashed assets first.
2. Deploy `index.html`, `manifest.webmanifest` and `sw.js` last.
3. Never clear user save storage during a cache update.
4. Keep save schema migration independent from service-worker cache state.
5. When repairing stale cache:
   - unregister or update only the service worker
   - clear Cache Storage entries belonging to the app
   - preserve localStorage and user-exported backups
6. Verify the new app shell in a private window.
7. Verify the installed PWA receives the new shell.
8. Keep the previous deployment package available for rollback.
