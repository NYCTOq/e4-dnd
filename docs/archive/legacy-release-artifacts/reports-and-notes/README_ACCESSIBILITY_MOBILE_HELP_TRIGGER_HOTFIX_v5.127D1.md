# E4 D&D v5.127D1 Accessibility Mobile Help Trigger Hotfix

Mobil Chromium, fiziksel mobil klavyede güvenilir olmayan `Shift+?` sentezine bağlı kalmadan görünür **Klavye yardımı** düğmesini kullanır.

Desktop testi `Shift+?` kısayımını doğrulamaya devam eder. Her iki proje de dialog görünürlüğünü, Escape ile kapanışı ve mobilde focus'un açan düğmeye dönüşünü sınar.

## Apply

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_ACCESSIBILITY_MOBILE_HELP_TRIGGER_HOTFIX_v5.127D1.ps1
```
