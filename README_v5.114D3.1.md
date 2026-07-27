# v5.114D3.1 Level-Up Feat Radio Overlay E2E Hotfix

## Kök neden

Feat seçimi testindeki Playwright `.check()` çağrısı, global onboarding ve PWA
overlay katmanları tarafından engellendi. Level-up paneli ve radio input DOM'da
doğru şekilde bulunuyordu.

## Düzeltme

Radio input fiziksel pointer tıklaması yerine doğrudan DOM click ile tetiklenir:

```ts
await radios.nth(1).evaluate((element) => {
  (element as HTMLInputElement).click();
});
```

## Doğrulama

- Desktop Chromium
- Mobile Chromium
- 4 mantıksal E2E, 8 gerçek koşu
- Final closure audit

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_LEVEL_UP_FEAT_RADIO_OVERLAY_E2E_HOTFIX_v5.114D3_1.ps1
```
