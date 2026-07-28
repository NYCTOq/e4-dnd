# v5.113D3 Spellbook / Play Mode / Combat Tracker Wiring, E2E & Final Closure

## Kapsam

- Spell runtime panelini ana React ağacına bağlama
- Contract raporundan gerçek Spellbook / Play / Combat route seçimi
- Character storage caster çözümü
- Combat storage target çözümü
- Slot harcama ve yenileme persistence
- Pact slot persistence
- Concentration persistence
- Combat target damage persistence
- Combat target healing persistence
- Desktop/mobile Playwright
- Tüm spell runtime sertifikasyon zinciri
- Build/PWA
- Final closure audit

## Sertifikasyon

```text
Core: 2313
Logical E2E: 3
Toplam: 2316
```

Playwright iki proje kullanıyorsa terminalde 6 gerçek koşu görünür.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_SPELL_UI_WIRING_E2E_FINAL_CLOSURE_MEGA_v5.113D3.ps1
```
