# v5.110D1 Equipment & Combat E2E Selector Matrix Hotfix

## Düzeltilenler

### Strict heading selector

Karakter adı hem `h1` hem `h2` olarak render edildiği için Playwright strict
mode iki element buluyordu.

Yeni selector:

```ts
page.getByRole("heading", {
  name: "Golden Shield Fighter",
  level: 1,
})
```

Wizard başlığı da aynı şekilde düzeltilir.

### Çift desktop/mobile matrisi

Playwright config zaten `desktop-chromium` ve `mobile-chromium` projelerini
çalıştırıyor. Spec içindeki ek desktop/mobile döngüsü kaldırılır.

Sonuç:

- Desktop project: 2 test
- Mobile project: 2 test
- Toplam: 4 E2E test

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_E2E_SELECTOR_MATRIX_HOTFIX_v5.110D1.ps1
```
