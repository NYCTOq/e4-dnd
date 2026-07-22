# Builder UI E2E + Mobile Mega Pack v5.90

## Kapsam

- Mobil Builder adım seçici
- Erişilebilir adım navigasyonu ve canlı ekran okuyucu duyurusu
- Adım değişiminde başlık odağı
- Mobil sticky kontrol alanı ve safe-area desteği
- Minimum 46–48 px dokunmatik kontroller
- Fighter, Wizard, Bard ve Monk class seçim yolculukları
- Mobil yatay taşma E2E kontrolü
- Builder navigasyon saf fonksiyon testleri

## Komutlar

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e:builder
```

Chromium yoksa önce:

```powershell
npx playwright install chromium
```
