# v5.110D Equipment & Combat Desktop/Mobile E2E Certification

Bu paket golden loadout karakterlerini gerçek uygulama arayüzünde açar.

## Senaryolar

- Desktop 2024 sword-and-shield fighter
- Mobile 2024 sword-and-shield fighter
- Desktop 2014 Fire Bolt wizard
- Mobile 2014 Fire Bolt wizard

## UI doğrulamaları

- Character detail yüklenmesi
- Inventory economy paneli
- Longsword, chain mail ve shield görünürlüğü
- AC görünürlüğü
- Damage die görünürlüğü
- 2024 weapon mastery görünürlüğü
- Offensive spell görünürlüğü

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_E2E_v5.110D.ps1
```

Bu komut önceki 569 testi, build ve raporları; ardından E2E testlerini çalıştırır.
