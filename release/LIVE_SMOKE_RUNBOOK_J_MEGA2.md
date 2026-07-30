# J-MEGA2 Live Smoke Runbook

After uploading the deployment folder to hosting:

1. Open the live home page in a private window.
2. Confirm HTTP status is below 500.
3. Confirm the app shell renders.
4. Open Character Builder, Characters, Play Mode and Settings.
5. Refresh a deep route.
6. Confirm `manifest.webmanifest` loads.
7. Confirm `sw.js` loads.
8. Install the PWA on one supported device.
9. Open the installed app once while online.
10. Reopen it while offline.
11. Create or load a test character.
12. Reload and confirm persistence.
13. Restore connectivity and confirm update behavior.
14. Run the final rollback check before announcing the release.
