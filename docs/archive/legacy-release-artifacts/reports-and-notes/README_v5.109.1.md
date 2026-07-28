# v5.109.1 Spellcasting E2E Heading Hotfix

Düzeltmeler:

- `Spells` başlığı exact eşleşmeyle bulunur.
- `Level 1 Spells`, `Always Prepared Spells` gibi başlıklarla karışmaz.
- Serial mod kaldırıldı.
- Bir test hata verse bile diğer testler çalışmaya devam eder.
- Class seçimi atomik DOM işlemiyle korunur.
- Worker sayısı 2 olarak kalır.

Kurulum:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELLCASTING_E2E_HEADING_HOTFIX_v5.109.1.ps1
```
