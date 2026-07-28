# v5.110C Golden Loadout & Combat Readiness Certification

Bu paket bağımsız oracle ve differential testlerden sonra gerçek karakter
loadout profillerini sertifikalandırır.

## Golden profiller

- 2014 Sword & Shield Fighter
- 2024 Sword & Shield Fighter
- 2024 Archer Fighter
- 2014 Rapier Rogue
- 2024 Greatsword Barbarian
- 2014 Unarmed Monk
- 2014 Fire Bolt Wizard
- 2024 Sacred Flame Cleric
- Missing weapon blocker
- Zero HP blocker

## Doğrulananlar

- Effective AC
- Inventory weight
- Combat readiness
- Primary combat options
- Attack bonus
- Damage summary
- Weapon mastery
- Blocker ve notice sayıları

## Gereksinim

v5.110A ve v5.110B zinciri uygulanmış olmalıdır.

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_GOLDEN_LOADOUT_COMBAT_READINESS_v5.110C.ps1
```

Tekrar çalıştırmak için:

```powershell
npm.cmd run certify:equipment-combat:complete
```

Uygulama runtime kodu değiştirilmez.
