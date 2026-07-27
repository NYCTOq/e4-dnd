# v5.109.2 Spellcasting E2E Render Stability Hotfix

Düzeltmeler:

- Class seçildikten sonra class kartının render edilmesi beklenir.
- Spells adımı sabit `#builder-active-step-title` üzerinden doğrulanır.
- React adımı geri değiştirirse Spells adımı en fazla üç kez yeniden açılır.
- Geçici olarak DOM'dan kopabilen form locator'ı kullanılmaz.
- Spellcasting içeriği sabit ana içerik üzerinden polling ile doğrulanır.
- Desktop ve mobile projeleri korunur.
- Worker sayısı 2 olarak kalır.

Kurulum:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELLCASTING_E2E_RENDER_STABILITY_HOTFIX_v5.109.2.ps1
```
