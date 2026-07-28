# E4 D&D v5.137 Full Playability Audit

Project root içine çıkarın ve çalıştırın:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_FULL_PLAYABILITY_AUDIT_v5.137.ps1
```

Üretilen raporlar:
- `reports/FULL_PLAYABILITY_AUDIT_v5.137.md`
- `reports/FULL_PLAYABILITY_AUDIT_v5.137.json`

Paket class, subclass, spell, feat, item, session loop ve manual runtime bridge için runtime/UI/test katmanlarını ayrı ayrı ölçer. Ardından production build çalıştırır.
