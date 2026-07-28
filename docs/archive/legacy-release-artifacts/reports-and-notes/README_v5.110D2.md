# v5.110D2 Equipment & Combat E2E Visible Scope Hotfix

## Kök neden

Mobile görünümde bazı içeriklerin hem görünür hem gizli DOM kopyaları vardı.
Playwright `.first()` kullandığında görünmeyen kopyayı seçiyordu.

## Düzeltmeler

- Ekipman adları yalnızca `inventory-economy-panel` içinde aranır.
- Tüm hedefler `.filter({ visible: true })` ile görünür öğelere sınırlandırılır.
- AC değerleri genel `/12/` veya `/18/` araması yerine tam eşleşmeyle aranır:
  - `^12$`
  - `^18$`
- Ana içerik `main` elementiyle sınırlandırılır.
- PowerShell patch aşaması başarısız olursa test zinciri durur.

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_E2E_VISIBLE_SCOPE_HOTFIX_v5.110D2.ps1
```

Bu paket yalnızca dört Equipment & Combat E2E testini çalıştırır.
