# E4 D&D Global Builder Integrity Certification v5.51

## Scope

- Level values are clamped to 1-20.
- Subclasses are removed when they belong to another class, edition catalog, or are below their selection level.
- Feat/ASI choices are reduced to the target level budget.
- Fighting Style, Weapon Mastery, Metamagic, Invocation, Wild Shape, Maneuver, Companion and Mystic Arcanum choices are pruned by current class/subclass/level rules.
- Known and prepared spells are filtered by class/subclass spell list, maximum spell level and current selection limits.
- Builder and Character Editor both apply the same normalization when the level changes.
- The normalizer never invents missing required choices; normal validation reports those to the user.

## Verification

- 164 test files passed.
- 669 tests passed.
- 0 failed tests.
- TypeScript and Vite production build passed.
- PWA generateSW completed with 85 precache entries.

## Known unrelated warning

`src/App.css` still contains a late `@import`. It does not fail the build and is outside this package.
