# E4 D&D v5.96 - Level 1-20 Advancement E2E Mega Pack

Bu paket level 1-20 ilerleme kapsamını tek doğrulama sözleşmesinde toplar.

## Kapsam

- 2024 Fighter, Wizard, Cleric ve Warlock
- 2014 Rogue ve Monk
- Subclass seçim seviyeleri
- Normal ve class-specific ASI/feat seviyeleri
- 2024 Epic Boon seviyesi
- Extra Attack ilerlemesi
- Spell progression ve Pact Magic ayrımı
- Level 20 capstone ve level cap davranışı
- Character Detail üzerinde level-up paneli ve level cap E2E kontrolü

## Doğrulama

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
npx playwright install chromium
npm.cmd run test:e2e:advancement
```

Tek komut:

```powershell
npm.cmd run verify:advancement
```
