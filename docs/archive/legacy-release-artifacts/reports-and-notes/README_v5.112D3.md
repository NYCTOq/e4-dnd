# v5.112D3 Class Feature UI Wiring, E2E & Final Closure Mega

## İçerik

- D1 contract raporundan gerçek Character/Play route seçimi
- Ana React ağacına Class Feature integration mount
- URL/storage üzerinden aktif karakter çözümü
- Açılmış class/subclass feature paneli
- Harca/Yenile işlemlerinin localStorage persistence'ı
- Desktop/mobile Playwright E2E
- Tüm `src/**/*.css` dosyalarında `@import` hijyen taraması
- Tüm class/subclass sertifikasyon zinciri
- Build/PWA
- Final closure audit

## Beklenen mantıksal sertifikasyon

```text
Core: 1242
E2E: 2
Toplam: 1244
```

Playwright iki proje kullanırsa terminalde 4 koşu görünür. Closure raporu mantıksal
senaryo sayısını 2 olarak kaydeder.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_CLASS_FEATURE_UI_WIRING_E2E_FINAL_CLOSURE_MEGA_v5.112D3.ps1
```
