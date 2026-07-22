# v5.89 Advancement Test Hotfix

Bu hotfix yalnız `levelUpAdvancementReadiness.test.ts` içindeki test fixture alanlarını günceller.

Eklenen alanlar:

- Subclass: `ruleset: "dnd_2024"`
- Subclass: `selectionLevel: 3`
- Ruleset: `monsters: []`

Uyguladıktan sonra:

```powershell
npm.cmd test
npm.cmd run build
```
