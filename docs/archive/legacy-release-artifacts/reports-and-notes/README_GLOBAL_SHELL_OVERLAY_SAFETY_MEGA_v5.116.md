# E4 D&D v5.116 — Global Shell, Onboarding & PWA Overlay Safety

Bu paket yalnızca değişen/yeni dosyaları içerir. ZIP içeriğini proje köküne,
klasör yapısını koruyarak çıkar ve dosyaların üzerine yaz.

## Kapanan riskler

- İlk kullanım penceresinin 650 ms sonra aniden açılıp tıklamayı yakalaması kaldırıldı.
- Rehber ilk render'da deterministik olarak açılır.
- Tamamlama localStorage'a kapanıştan önce senkron yazılır.
- Escape, ilk odak, scroll kilidi ve odak geri dönüşü eklendi.
- Sabit PWA bildirimlerinin hit alanları görünür sınırlarıyla sınırlandı.
- Masaüstü ve mobil Chromium'da gerçek Playwright `.click()` akışı eklendi.

## Tek komut

```powershell
powershell -ExecutionPolicy Bypass -File .\APPLY_GLOBAL_SHELL_OVERLAY_SAFETY_MEGA_v5.116.ps1
```

Beklenen sonuç: contract testleri, production/PWA build, audit ve iki tarayıcı
profilindeki fiziksel tıklama testlerinin tamamı geçer.
