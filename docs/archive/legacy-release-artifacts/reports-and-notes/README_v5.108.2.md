# v5.108.2 Ability E2E Atomic Stability Hotfix

Düzeltmeler:

- Her testten önce Builder taslağı temizlenir.
- Yöntem butonları tam adla bulunur:
  - Standard Array
  - Point Buy
  - Rolled / Manual
- React yeniden render sırasında locator tutulmaz.
- Buton seçimi tek DOM işleminde yapılır.
- Ability kartları tek tek değil atomik olarak okunur.
- Testler serial çalışır.
- Worker sayısı 2'ye düşürülür.

Kurulum:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_ABILITY_E2E_ATOMIC_STABILITY_HOTFIX_v5.108.2.ps1
```
