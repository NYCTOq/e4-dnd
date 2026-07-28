# v5.129 Playable Content Audit & Priority Map Mega

This package ends the separate A/B/C/D certification-package pattern.

It adds a source-driven audit that detects current class, subclass, spell, feat, item and automated-test inventory, writes Markdown/JSON reports, and locks the implementation order for v5.130+.

## Apply

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_PLAYABLE_CONTENT_AUDIT_PRIORITY_MAP_MEGA_v5.129.ps1
```

## Output

- `reports/PLAYABLE_CONTENT_AUDIT_v5.129.md`
- `reports/PLAYABLE_CONTENT_AUDIT_v5.129.json`

## Next implementation order

1. v5.130 Class Runtime Completion Mega
2. v5.131 Subclass Runtime Completion Mega
3. v5.132 Spell Runtime Completion Mega
4. v5.133 Feat & Item Runtime Mega
5. v5.134 Session Play Loop Mega
