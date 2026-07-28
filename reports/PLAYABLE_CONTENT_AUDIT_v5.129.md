# E4 D&D Playable Content Audit v5.129

Generated: 2026-07-28T10:21:23.049Z

## Inventory

| Area | Detected |
|---|---:|
| Classes | 12 |
| Subclasses | 113 |
| Spells | 277 |
| Feats | 26 |
| Items | 145 |
| Automated test files | 358 |

## Decision

The project already has extensive certification coverage. From v5.130 onward, separate discovery/matrix/golden/UI closure package chains are frozen. Each package must deliver a playable capability and carry only targeted regression tests.

## Implementation order

1. **Class feature runtime depth**  
   Twelve classes exist, but catalogue presence is not the same as every level feature being interactive in play mode.  
   Next: `v5.130 Class Runtime Completion Mega`

2. **Subclass feature runtime depth**  
   Subclass catalogue is broad; the next risk is placeholder summaries without executable resources, actions, reactions, saves or persistence.  
   Next: `v5.131 Subclass Runtime Completion Mega`

3. **Spell edge-case runtime**  
   Spell catalogue is large; summons, persistent zones, reactions, concentration and material-cost flows need playable parity rather than catalogue-only coverage.  
   Next: `v5.132 Spell Runtime Completion Mega`

4. **Feat and item effect wiring**  
   Passive bonuses are useful, but action-granting feats and charged items must appear and persist in sheet/play flows.  
   Next: `v5.133 Feat & Item Runtime Mega`

5. **Campaign-to-play loop**  
   Characters, encounters, rest, loot and journals exist; the remaining value is a continuous session loop with fewer manual jumps.  
   Next: `v5.134 Session Play Loop Mega`

## Runtime signals

```json
{
  "class": {
    "handlers": 0,
    "resourceMentions": 51,
    "persistenceMentions": 0
  },
  "subclass": {
    "handlers": 0,
    "resourceMentions": 22,
    "persistenceMentions": 0
  },
  "spell": {
    "handlers": 1,
    "resourceMentions": 0,
    "persistenceMentions": 0
  },
  "feat": {
    "handlers": 0,
    "resourceMentions": 2,
    "persistenceMentions": 0
  },
  "item": {
    "handlers": 1,
    "resourceMentions": 0,
    "persistenceMentions": 0
  }
}
```
