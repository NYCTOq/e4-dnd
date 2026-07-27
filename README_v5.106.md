# v5.106 Mega Certification Expansion

## Kurulum

ZIP içeriğini proje köküne çıkarın:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_MEGA_CERTIFICATION_v5.106.ps1
```

İlk kurulum hızlı sertifikasyon paketini çalıştırır.

## Sonraki komutlar

Tüm ancestry/species tarayıcı testleri:

```powershell
npm.cmd run certify:ancestry:all
```

Tam release sertifikasyonu:

```powershell
npm.cmd run certify:mega:release
```

## Kapsam

- 2014: 9 temel race
- 2024: 10 temel species
- 12 class
- 1-20 proficiency progression
- 1-20 average HP oracle
- subclass unlock seviyeleri
- full caster slot tablosu
- 100+ deterministic senaryo
- desktop/mobile ancestry smoke testleri
