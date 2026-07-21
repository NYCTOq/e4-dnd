# Multiclass Spellcasting & Class Separation Certification v5.64

## Scope

This package separates multiclass spellcasting identity from the shared spell-slot pool.

## Implemented

- Added optional per-spell source class mapping (`spellSources`).
- Added optional class-specific known and prepared spell maps.
- Added source inference from the spell class list for legacy characters.
- Added class-specific spellcasting ability, Spell Save DC, and Spell Attack Bonus.
- Added Eldritch Knight and Arcane Trickster handling as Intelligence casters using the Wizard spell list.
- Updated Play Mode spell attacks and saves to use each spell's source class ability.
- Updated Character Detail to show separate spellcasting statistics for each casting class.
- Added source class and casting ability labels to spell rows.
- Preserved old character files through optional fields and fallback inference.

## Verification

- 178 test files passed.
- 750 tests passed.
- TypeScript production build passed.
- Vite production build passed.
- PWA service worker generated with 86 precache entries.
