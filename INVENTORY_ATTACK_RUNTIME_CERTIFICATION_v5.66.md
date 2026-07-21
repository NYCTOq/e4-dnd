# Inventory, Equipment, Attunement & Attack Runtime Certification v5.66

## Scope

This package strengthens the character builder and editor inventory runtime without replacing existing item catalogs.

## Implemented

- Attunement controls are available directly in the inventory manager.
- The three-item attunement limit is displayed and enforced.
- Items requiring attunement show their current state and block a fourth attunement.
- Equipment proficiency and Strength requirement issues are displayed per owned item.
- Multiclass proficiency profiles are considered when evaluating equipment legality.
- Weapon attack calculations can omit proficiency bonus for non-proficient attacks.
- Versatile weapon damage can be calculated separately for one-handed and two-handed use.
- Magic-item rarity and attunement status are visible in item metadata.
- Builder and Character Editor pass class data to the shared equipment manager.

## Verification

- Targeted equipment, magic-item and attack runtime tests: 19 passed.
- Full Vitest suite: 180 test files, 755 tests, 0 failures.
- TypeScript and Vite production build: passed.
- PWA service worker generation: passed with 84 precache entries.
