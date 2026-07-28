# v5.108.1 Ability E2E UI Structure Hotfix

Sorun:
- Ability ekranı `input[type="number"]` kullanmıyor.
- Standard Array select, Point Buy özel stepper, Manual/Rolled ise NumberStepper kullanıyor.

Düzeltme:
- Altı ability kartı doğrulanır.
- STR, DEX, CON, INT, WIS, CHA sırası kontrol edilir.
- Altı final skor kontrol edilir.
- Standard Array için 6 select doğrulanır.
- Point Buy için 6 stepper doğrulanır.
- Manual/Rolled için 6 NumberStepper doğrulanır.

Kurulum:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_ABILITY_E2E_UI_STRUCTURE_HOTFIX_v5.108.1.ps1
```
