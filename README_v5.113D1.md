# v5.113D1 Spell UI Integration Discovery Contract Gate

## Amaç

Spellbook, Play Mode ve Combat Tracker entegrasyonunu proje yapısını tahmin
etmeden doğru dosyalara bağlamak.

## Keşfedilen alanlar

- Spellbook
- Prepared / known spells
- Normal spell slots
- Pact spell slots
- Play Mode casting
- Concentration UI
- Combat Tracker hedef ve HP yapısı
- Character/combat storage
- Routes
- `data-testid` değerleri
- Export edilen semboller

## Raporlar

```text
certification-reports/spell-ui-contract-v5.113D1.json
certification-reports/spell-ui-contract-v5.113D1.md
```

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELL_UI_INTEGRATION_DISCOVERY_CONTRACT_GATE_v5.113D1.ps1
```

## Sonraki paket

v5.113D2, spell casting paneli, slot harcama, concentration ve combat target
persistence bridge temelini ekleyecektir.
