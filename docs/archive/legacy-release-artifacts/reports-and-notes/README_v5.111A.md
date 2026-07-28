# v5.111A Rest, Recovery & Resource Oracle + Runtime Discovery Mega

Bu paket yeni büyük-paket çalışma modelinin ilk aşamasıdır.

## İçerik

### Bağımsız referans oracle

- Proficiency bonus
- Ability modifier
- Hit Die harcama
- Hit Die iyileştirmesi
- 2014 Long Rest Hit Dice recovery
- 2024 Long Rest Hit Dice recovery
- Short Rest resource recovery
- Long Rest resource recovery
- Pact slot short-rest recovery
- Normal spell slot long-rest recovery
- HP ve temporary HP davranışı
- Death save reset
- Exhaustion recovery
- Concentration cleanup
- Active effect cleanup
- Mutation güvenliği
- Sınır ve clamp senaryoları

### Runtime discovery

`src` klasöründeki mevcut rest/resource kodunu tarar ve şu alanların aday
dosyalarını raporlar:

- Short Rest
- Long Rest
- Hit Dice
- Spell slots
- Class resources
- Exhaustion
- Death saves
- Concentration

## Üretilen raporlar

```text
certification-reports/rest-recovery-runtime-discovery-v5.111A.json
certification-reports/rest-recovery-runtime-discovery-v5.111A.md
```

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Çalıştır:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_REST_RECOVERY_ORACLE_DISCOVERY_MEGA_v5.111A.ps1
```

## Sonraki paket

Discovery çıktısındaki gerçek runtime fonksiyonlarına bağlanan büyük
differential + scenario matrix paketi olacaktır.
