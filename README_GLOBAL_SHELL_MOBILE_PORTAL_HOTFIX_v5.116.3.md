# E4 D&D v5.116.3 — Mobile Release Notes Portal Hotfix

ZIP içeriğini proje köküne çıkarıp dosyaların üzerine yaz. Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_GLOBAL_SHELL_OVERLAY_SAFETY_MEGA_v5.116.ps1
```

Sürüm notu düğmesi sidebar içinde kalır. Açılan modal ise `document.body`
üzerine portal edilir; bu nedenle mobilde gizlenen sidebar modalı gizleyemez.
