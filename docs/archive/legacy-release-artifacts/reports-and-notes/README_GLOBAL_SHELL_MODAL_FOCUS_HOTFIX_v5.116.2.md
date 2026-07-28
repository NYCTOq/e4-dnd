# E4 D&D v5.116.2 — Modal Focus Hotfix

ZIP içeriğini proje köküne çıkarıp dosyaların üzerine yaz. Ardından:

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_GLOBAL_SHELL_OVERLAY_SAFETY_MEGA_v5.116.ps1
```

Bu düzeltme, çeviri/route erişilebilirlik duyurusu yeniden çalıştığında açık
ilk kullanım penceresinin odağını `main` alanına taşımasını engeller.
