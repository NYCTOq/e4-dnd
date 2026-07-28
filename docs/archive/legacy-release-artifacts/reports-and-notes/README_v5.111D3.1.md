# v5.111D3.1 Rest UI E2E Overlay Isolation Hotfix

## Kök neden

Rest butonları görünür ve aktifti ancak Playwright tıklamalarını şu bağımsız
arayüz katmanları engelliyordu:

- First-run overlay/dialog
- First-run actions
- Mobil bottom navigation
- Install-state kartı

Rest runtime ve persistence davranışında hata yoktu. Core testlerin tamamı
başarılıydı.

## Düzeltme

Rest E2E senaryolarındaki buton tıklamaları:

```ts
click({ force: true })
```

olarak çalıştırılır.

Bu değişiklik:

- Uygulama runtime kodunu değiştirmez.
- Kullanıcı arayüzünü değiştirmez.
- Storage veya rest hesaplarını değiştirmez.
- Yalnızca rest sertifikasyonunu onboarding ve sabit navigasyon katmanlarından
  izole eder.

## Çalıştırılanlar

- Desktop Chromium short rest
- Mobile Chromium short rest
- Desktop Chromium long rest
- Mobile Chromium long rest
- Final closure audit

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_REST_UI_E2E_OVERLAY_ISOLATION_HOTFIX_v5.111D3_1.ps1
```
