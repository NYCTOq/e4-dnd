# E4 D&D v5.100 — Mobile UI, Accessibility & Performance Mega Pack

## Kapsam

- 44 px masaüstü ve 48 px mobil dokunmatik hedef standardı
- `:focus-visible` klavye odağı
- `prefers-reduced-motion` desteği
- Mobil safe-area boşlukları
- Global yatay taşma koruması
- Büyük kataloglar için 80 kayıtlık başlangıç render bütçesi
- Ayarlar ekranında Accessibility & Performance kalite paneli
- Unit ve Playwright E2E testleri

## Doğrulama

```powershell
npm.cmd install
npm.cmd run verify:mobile-quality
```

Playwright tarayıcısı eksikse:

```powershell
npx playwright install chromium
```
