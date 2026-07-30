# N-MEGA1 Player Character System Inventory

Generated: 2026-07-30T09:11:37.698Z

## Scope

- D&D Beyond is used only as a builder and character-management capability reference.
- The actual target is complete, copyright-safe D&D 2014 and 2024 player-character creation and play support from level 1 through 20.
- This audit does not claim rules correctness merely because an entity exists.

## Counts

| Ruleset | Classes | Subclasses | Races/Species | Backgrounds | Feats | Spells | Items |
|---|---:|---:|---:|---:|---:|---:|---:|
| dnd_2014 | 12 | 12 | 9 | 13 | 12 | 58 | 35 |
| dnd_2024 | 12 | 12 | 10 | 16 | 20 | 58 | 35 |

## Structural findings

- Critical findings: 0
- High findings: 0
- Medium findings: 103
- Duplicate groups: 0
- Source/test files scanned: 1008

## Important limitation

This first audit proves repository inventory and structural wiring only. Mechanical truth, official option completeness, builder reachability, runtime behavior, persistence, and level-by-level correctness require the later N-MEGA certification phases.

## Next gate

N-MEGA2 must create an independent 2014 expected-capability oracle and compare it against catalog, builder, sheet, runtime, rest, persistence, and tests. N-MEGA3 repeats the same process for 2024.