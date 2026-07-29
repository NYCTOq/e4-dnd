# E4 D&D v6.2A2 Player Content Gap Priority

This package reads the v6.2A1 inventory report and turns it into an ordered player-content backlog.

It classifies findings as:

- P0: character creation, class progression or catalog reference blockers
- P1: major player-choice bottlenecks
- P2: thin but usable catalog areas

It evaluates:

- subclass count per class
- spell count per spell level
- class spell-list depth
- complete 1-20 progression
- race / ancestry count
- background count
- feat count
- structural findings from v6.2A1

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PLAYER_CONTENT_GAP_PRIORITY_v6.2A2.ps1
```

Outputs:

- `reports/PLAYER_CONTENT_GAP_PRIORITY_v6.2A2.json`
- `reports/PLAYER_CONTENT_GAP_PRIORITY_v6.2A2.md`
