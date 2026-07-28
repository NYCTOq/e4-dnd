# v5.109.5 Spellcasting E2E Final Selector Hotfix

## Düzeltilen iki hata

1. Desktop class select locator'ı yanlış relative `has` locator kullanıyordu.
2. Mobile testler responsive CSS ile gizlenen sidebar step butonlarına tıklıyordu.

## Yeni yaklaşım

- Adım geçişleri her görünümde mevcut olan "Aktif adım" select'iyle yapılır.
- Class select bütün form select'leri içinde exact option text ile bulunur.
- React DOM düğümleri silinmez.
- Uygulama koduna dokunulmaz.
- Tek worker korunur.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELLCASTING_E2E_FINAL_SELECTOR_HOTFIX_v5.109.5.ps1
```
