# L-MEGA1 Launch Handoff

## Upload source

Use only:

`release/E4_DND_6.2.0_PUBLIC.zip`

Verify it against:

`release/E4_DND_6.2.0_PUBLIC.sha256`

## Hosting procedure

1. Preserve the current live deployment as a rollback copy.
2. Extract the public ZIP locally.
3. Upload the extracted contents to the selected document root.
4. Apply the correct SPA deep-route fallback for Apache or Nginx.
5. Keep `index.html`, `manifest.webmanifest` and `sw.js` on no-cache headers.
6. Keep hashed assets on long immutable caching.
7. Open the site in a private window before clearing any cache.
8. Run the live smoke checklist.
9. Run physical-device acceptance.
10. Record evidence in `LAUNCH_EVIDENCE_L_MEGA1.json`.

Do not delete browser localStorage while correcting service-worker or cache problems.
