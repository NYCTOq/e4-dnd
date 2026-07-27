# v5.109.6 Spellcasting E2E Responsive Navigation Hotfix

## Kök neden

- Mobil görünümde sidebar step butonları gizli.
- Desktop görünümde mobil toolbar select'i gizli.
- Tek navigasyon yöntemi iki viewport için birden kullanılamaz.

## Düzeltme

- Mobil toolbar select görünürse `selectOption()` kullanılır.
- Mobil toolbar gizliyse görünür desktop sidebar butonu tıklanır.
- React DOM düğümleri silinmez.
- Class seçimi exact option text ile atomik yapılır.
- Uygulama koduna dokunulmaz.
- Tek worker korunur.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELLCASTING_E2E_RESPONSIVE_NAV_HOTFIX_v5.109.6.ps1
```
