# E4 D&D v5.121D3 Cross-Domain UI E2E Runtime Alignment Hotfix

This hotfix aligns the v5.121D Playwright suite with the real application contracts.

- Preserves mutated localStorage character data across reloads instead of re-seeding the original fixture.
- Uses the desktop stepper on desktop and the mobile toolbar on mobile.
- Waits for the asynchronously loaded class selector to become enabled.
- Expects temporary HP to absorb damage before current HP (`24 HP + 3 temp HP - 4 damage = 23 HP`).
- Activates the mobile long-rest button through its native DOM click when the fixed bottom navigation overlaps the physical click point.

Run `APPLY_CROSS_DOMAIN_UI_E2E_RUNTIME_ALIGNMENT_HOTFIX_v5.121D3.ps1` from the project root.
