# v5.109.3 Spellcasting E2E Class Selector Hotfix

Sorun:

`label.filter({ hasText: /^Class$/ })` label içindeki select ve option
metinlerini de hesaba kattığı için hiçbir Class alanını bulamıyordu.

Düzeltme:

- Race & Class formu doğrudan açılır.
- Class option'ı bütün select'ler içinde exact text ile aranır.
- Option bulma ve seçme atomik DOM işlemiyle yapılır.
- Seçilen class kartının render edilmesi beklenir.
- Spells adımı sabit başlık üzerinden doğrulanır.
- Desktop ve mobile testleri korunur.
- Worker sayısı 2 olarak kalır.

Kurulum:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELLCASTING_E2E_CLASS_SELECTOR_HOTFIX_v5.109.3.ps1
```
