# E4 D&D v5.70 Final Integrity, E2E & Release Readiness

Bu paket Builder, Character Sheet, Play Mode, Rest, Backup/Import ve offline PWA zincirini tek release gate altında toplar.

## Yeni release gate

- Unit/integration testleri
- Production/PWA build
- Statik analiz
- Browser E2E
- Backup round-trip
- Refresh/offline açılış
- Mobil navigasyon
- Builder → Sheet → Play oyuncu yolculuğu
- Migration ve crash blocker kontrolleri

Bir kontrol çalıştırılmadıysa başarı olarak yazılmaz; `warning` olarak görünür. Başarısız kritik yolculuklar, migration hataları ve çözülmemiş crash kayıtları release'i bloke eder.

## E2E preflight

`npm run test:e2e` artık Chromium kurulmamışsa onlarca tekrar ve zaman aşımı üretmek yerine hemen anlaşılır hata verir.

Kurulum:

```powershell
npx playwright install chromium
```

Alternatif mevcut Chrome yolu:

```powershell
$env:E4_CHROMIUM_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
npm.cmd run test:e2e
```

Tam doğrulama:

```powershell
npm.cmd run release:verify
```
