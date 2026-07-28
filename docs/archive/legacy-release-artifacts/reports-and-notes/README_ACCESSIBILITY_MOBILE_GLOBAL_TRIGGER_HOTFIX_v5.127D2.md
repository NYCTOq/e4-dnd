# v5.127D2 Accessibility Mobile Global Trigger Hotfix

Moves `AccessibilityHelpDialog` outside the desktop-only sidebar so its trigger remains visible on mobile.

- Desktop: fixed trigger near the sidebar; `Shift+?` remains certified.
- Mobile: fixed trigger above bottom navigation; physical click, Escape close and focus restoration are certified.
- No hidden-element or forced-click workaround.
