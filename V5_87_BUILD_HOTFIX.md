# v5.87 Build Hotfix

Bu hotfix iki test fixture'ındaki eksik `spellcastingAbility` alanını tamamlar.

Düzeltilen dosyalar:
- `src/core/rulesets/levelOneActionEconomyReadiness.test.ts`
- `src/core/rulesets/levelOneRestReadiness.test.ts`

Fighter spellcaster olmadığı için değer `null` olarak ayarlanmıştır.

Kurulumdan sonra:
```powershell
npm.cmd test
npm.cmd run build
```
