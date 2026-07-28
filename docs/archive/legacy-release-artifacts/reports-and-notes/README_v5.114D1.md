# v5.114D1 Builder / Character Detail / Play Mode Level-Up UI Contract Discovery Mega

## Amaç

Level-up sistemini gerçek uygulama ekranlarına tahmin yürüterek değil, mevcut
dosya, route, selector ve storage sözleşmelerine göre bağlamak.

## Keşfedilen alanlar

- Builder
- Character Editor
- Character Detail
- Play Mode
- Level-up action alanları
- ASI / feat seçim alanları
- Subclass seçim alanları
- Character persistence
- Route'lar
- `data-testid` değerleri
- Storage anahtarları
- Export edilen semboller

## Raporlar

```text
certification-reports/level-up-ui-contract-v5.114D1.json
certification-reports/level-up-ui-contract-v5.114D1.md
```

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_LEVEL_UP_UI_CONTRACT_DISCOVERY_MEGA_v5.114D1.ps1
```

## Sonraki paket

v5.114D2, gerçek level-up paneli, character persistence bridge, ASI/feat seçimi
ve subclass pending flow temelini ekleyecektir.
