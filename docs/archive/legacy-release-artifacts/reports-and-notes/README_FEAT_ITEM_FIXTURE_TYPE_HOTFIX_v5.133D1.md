# v5.133D1 Feat & Item Fixture Type Hotfix

Fixes the TypeScript build failure in `featItemRuntimeCompletion-v5.133.test.ts`.

## Root cause

`DndItemData.cost` is required, but the test fixture only supplied the legacy numeric `costGp` field and then forced the object through `as DndItemData`.

## Fix

- Adds `cost: "1 gp"` to the fixture.
- Replaces the unsafe cast with `satisfies DndItemData` so future required-field changes fail at the fixture declaration.
- Runs the full existing v5.133 certification chain.
