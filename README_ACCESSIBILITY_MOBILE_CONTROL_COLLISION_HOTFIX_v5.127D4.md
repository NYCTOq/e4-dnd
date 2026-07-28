# v5.127D4 Accessibility Mobile Control Collision Hotfix

## Root cause
The first-run overlay was correctly dismissed. The remaining failure was a real mobile UI collision: `pwa-install-guide-open` and `accessibility-help-trigger` were both fixed near the bottom-right at the same vertical position, so the install button intercepted clicks intended for keyboard help.

## Fix
- Mobile PWA install trigger moves to the bottom-left.
- Accessibility help remains bottom-right.
- Mobile E2E asserts both controls are visible and their bounding boxes do not overlap before performing a physical click.
- No `force: true`, no hidden controls, and no production overlay suppression.
