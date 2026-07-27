# v5.109.4 Spellcasting E2E DOM Integrity Hotfix

## Kök neden

Test, React tarafından yönetilen `.first-run-overlay` düğümünü
`element.remove()` ile DOM'dan siliyordu.

React sonraki render sırasında bu düğümü hâlâ kendi ağacında sandığı için:

```text
NotFoundError: Failed to execute 'insertBefore' on 'Node'
```

hatası oluşuyor ve Builder ağacı çöküyordu.

## Düzeltmeler

- `.first-run-overlay` artık DOM'dan silinmez.
- Overlay yalnızca CSS ile görünmez ve etkileşimsiz yapılır.
- Class seçimi Playwright `selectOption()` ile yapılır.
- Step geçişi gerçek `click()` ile yapılır.
- Uygulama kaynak koduna dokunulmaz.
- Test worker sayısı stabilite için 1 olarak tutulur.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELLCASTING_E2E_DOM_INTEGRITY_HOTFIX_v5.109.4.ps1
```
