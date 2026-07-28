# Full Content Integrity & Missing Catalog Audit v5.92

Bu paket class, subclass, race/species, background, feat, spell, item ve monster katalogları için ortak bütünlük denetimi ekler.

## Denetimler

- Yinelenen veya boş ID kayıtları
- Class level 1–20 progression bütünlüğü
- Subclass → class referansı ve seçim seviyesi
- Background → Origin Feat referansı
- Spell → class listesi referansı
- Pack → item içeriği referansı
- Spell metadata ve saving throw alanları
- Weapon damage ve armor AC zorunluluğu
- Boş katalog bildirimi
- Ruleset Center görünür audit paneli

## Doğrulama

```powershell
npm.cmd test
npm.cmd run build
npx playwright install chromium
npm.cmd run test:e2e:content
```

Tek komut:

```powershell
npm.cmd run verify:content
```
