# v5.111D3.2 Rest UI E2E DOM Action & Persistence Hotfix

## Kök neden

Pointer tabanlı Playwright tıklamaları şu katmanlardan etkileniyordu:

- First-run overlay
- Mobil bottom navigation
- Viewport konumu
- Onboarding yeniden render işlemleri

`force: true` pointer engelini azalttı ancak:

- Mobilde viewport kontrolü yine hata üretebildi.
- Desktop short-rest sonucunda onboarding yeniden render sonrası geçici mesaj
  sıfırlanabildi.

## Düzeltme

Butonlar doğrudan DOM üzerinden tetiklenir:

```ts
await locator.evaluate((element) => {
  (element as HTMLButtonElement).click();
});
```

Başarı geçici UI mesajından değil, kalıcı storage sonucundan doğrulanır:

- Short Rest resource recovery
- Pact slot recovery
- HP'nin korunması
- Long Rest HP recovery
- Temp HP temizliği
- Death save reset
- Concentration temizliği
- Exhaustion recovery

Panel, butonlar ve sonuç alanının DOM'da bulunduğu ayrıca doğrulanır.

## Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_REST_UI_E2E_DOM_ACTION_PERSISTENCE_HOTFIX_v5.111D3_2.ps1
```
