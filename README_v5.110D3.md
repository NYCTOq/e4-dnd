# v5.110D3 Equipment & Combat E2E Item Scope Hotfix

## Kök neden

`inventory-economy-panel` görünür ve doğru çalışıyordu ancak item adları
bu panelin içinde değil, character detail sayfasının başka bölümünde
render ediliyordu.

## Düzeltme

- Inventory panel görünürlüğü korunur.
- Longsword, Chain Mail ve Shield tüm sayfada aranır.
- Yalnızca görünür eşleşmeler kabul edilir.
- Wizard, AC, damage ve mastery assertionları değiştirilmez.

## Kurulum

ZIP içeriğini proje köküne çıkar:

```text
D:\Projects\e4_dnd
```

Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_EQUIPMENT_COMBAT_E2E_ITEM_SCOPE_HOTFIX_v5.110D3.ps1
```
